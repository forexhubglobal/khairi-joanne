import urllib.request, re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
req = urllib.request.Request('https://www.pexels.com/search/videos/wedding%20rings/', headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
        links = re.findall(r'href="(/video/[^"]+)"', html)
        print('Found pexels video links:', len(links))
        for l in sorted(list(set(links)))[:15]:
            print('https://www.pexels.com' + l)
except Exception as e:
    print('Error:', e)
