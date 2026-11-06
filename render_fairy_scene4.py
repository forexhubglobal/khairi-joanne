import cv2
import numpy as np
import subprocess
import os
import sys

FFMPEG_PATH = r"C:\Users\US\AppData\Local\Programs\Python\Python311\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
BG_VIDEO = "scratch/sakura_test/tmLeakFZOrg.f401.mp4"
RING_VIDEO = "videos/ring_motion_4k.mp4"
PETAL_VIDEO = "scratch/sakura_test/yZSN-tWHO0E.f398.mp4"

def load_all_frames(video_path, max_frames=None):
    cap = cv2.VideoCapture(video_path)
    frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)
        if max_frames and len(frames) >= max_frames:
            break
    cap.release()
    return frames

def get_clean_ring_mask(ring_frame):
    b = ring_frame[:, :, 0].astype(float)
    g = ring_frame[:, :, 1].astype(float)
    r = ring_frame[:, :, 2].astype(float)
    val = (r + g + b) / 3.0

    # Ring color mask (gold + diamond sparkle)
    ring_mask = (((r > b + 16) & (g > b + 7)) | (val > 180)).astype(np.uint8)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    ring_mask_clean = cv2.morphologyEx(ring_mask, cv2.MORPH_CLOSE, kernel).astype(float)

    # Strictly cut/fade reflection: rings end at ~780, fade from 770 to 810
    fade_mat = np.ones_like(ring_mask_clean)
    fade_mat[810:] = 0.0
    fade_mat[770:810] = np.linspace(1.0, 0.0, 40)[:, None]
    ring_mask_clean = ring_mask_clean * fade_mat
    ring_mask_clean = cv2.GaussianBlur(ring_mask_clean, (11, 11), 0)
    return ring_mask_clean

def render_scene(is_mobile=True, output_path="test_out.mp4", total_frames=300):
    print(f"Loading assets for {'mobile' if is_mobile else 'desktop'}...")
    bg_frames = load_all_frames(BG_VIDEO)
    ring_frames = load_all_frames(RING_VIDEO)
    petal_frames = load_all_frames(PETAL_VIDEO, max_frames=total_frames)

    num_bg = len(bg_frames)
    num_petals = len(petal_frames)
    print(f"Loaded: {num_bg} bg frames, {len(ring_frames)} ring frames, {num_petals} petal frames")

    # Dimensions
    if is_mobile:
        out_w, out_h = 1080, 1920
        ring_w = 920
        pos_x = (out_w - ring_w) // 2
        pos_y = 920
    else:
        out_w, out_h = 1920, 1080
        ring_w = 800
        pos_x = (out_w - ring_w) // 2
        pos_y = 520

    # FFmpeg pipe
    cmd = [
        FFMPEG_PATH,
        "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{out_w}x{out_h}",
        "-pix_fmt", "bgr24",
        "-r", "30",
        "-i", "-",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-g", "30",
        "-keyint_min", "30",
        "-movflags", "+faststart",
        output_path
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    ring_start = 50
    ring_end = len(ring_frames) - 1
    ring_span = ring_end - ring_start
    ring_cycle = 2 * ring_span

    bg_cycle = 2 * (num_bg - 1)

    print(f"Rendering {total_frames} frames to {output_path}...")
    for i in range(total_frames):
        # 1. Background frame ping-pong
        bg_mod = i % bg_cycle
        bg_idx = bg_cycle - bg_mod if bg_mod >= num_bg else bg_mod
        bg_raw = bg_frames[bg_idx]

        if is_mobile:
            # Scale height to 1920 and center-crop 1080
            h_bg, w_bg = bg_raw.shape[:2]
            scale = 1920.0 / h_bg
            scaled_bg = cv2.resize(bg_raw, (int(w_bg * scale), 1920), interpolation=cv2.INTER_LANCZOS4)
            crop_x = int((scaled_bg.shape[1] - 1080) * 0.45)
            comp_bg = scaled_bg[:, crop_x : crop_x + 1080].copy()
        else:
            comp_bg = cv2.resize(bg_raw, (1920, 1080), interpolation=cv2.INTER_LANCZOS4)

        # 2. Ring frame ping-pong
        r_mod = i % ring_cycle
        r_step = (ring_cycle - r_mod) if r_mod >= ring_span else r_mod
        r_idx = ring_start + r_step
        ring_raw = ring_frames[r_idx]

        # Ring mask & scale
        ring_mask = get_clean_ring_mask(ring_raw)
        ring_scale = ring_w / ring_raw.shape[1]
        ring_h = int(ring_raw.shape[0] * ring_scale)
        ring_scaled = cv2.resize(ring_raw, (ring_w, ring_h), interpolation=cv2.INTER_LANCZOS4)
        mask_scaled = cv2.resize(ring_mask, (ring_w, ring_h))[:, :, None]

        # Blend ring onto background
        roi = comp_bg[pos_y : pos_y + ring_h, pos_x : pos_x + ring_w].astype(float)
        blended = roi * (1.0 - mask_scaled) + ring_scaled.astype(float) * mask_scaled
        comp_bg[pos_y : pos_y + ring_h, pos_x : pos_x + ring_w] = np.clip(blended, 0, 255).astype(np.uint8)

        # 3. Petals overlay (screen blend)
        pet_idx = i % num_petals
        pet_raw = petal_frames[pet_idx]
        pet_scaled = cv2.resize(pet_raw, (out_w, out_h), interpolation=cv2.INTER_LANCZOS4).astype(float)

        bg_float = comp_bg.astype(float) / 255.0
        p_float = pet_scaled / 255.0 * 0.9
        screen_comp = 1.0 - (1.0 - bg_float) * (1.0 - p_float)
        final_frame = (np.clip(screen_comp, 0, 1.0) * 255).astype(np.uint8)

        proc.stdin.write(final_frame.tobytes())

        if (i + 1) % 50 == 0:
            print(f"Rendered {i + 1}/{total_frames} frames...")

    proc.stdin.close()
    proc.wait()
    print(f"Successfully generated {output_path}")

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "both"
    if mode in ("mobile", "both"):
        render_scene(is_mobile=True, output_path="videos/mobile/fairy_scene4.mp4")
    if mode in ("desktop", "both"):
        render_scene(is_mobile=False, output_path="videos/fairy_scene4.mp4")
