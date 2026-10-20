#!/bin/bash
# usage: overpass.sh <out.json> <query-file> [tries]
OUT=$1; Q=$2; TRIES=${3:-12}
for i in $(seq 1 $TRIES); do
  for ep in https://overpass-api.de/api/interpreter https://lz4.overpass-api.de/api/interpreter https://z.overpass-api.de/api/interpreter; do
    code=$(curl -s -m 240 -A "nyc-layout-research/1.0 (three.js city sim)" -o "$OUT.tmp" -w "%{http_code}" --data-urlencode "data@$Q" "$ep")
    if [ "$code" = "200" ] && head -c 1 "$OUT.tmp" | grep -q '{'; then
      mv "$OUT.tmp" "$OUT"; echo "ok $ep try $i size $(wc -c < "$OUT")"; exit 0
    fi
    echo "try $i $ep -> $code"
    sleep $((i * 4))
  done
done
echo FAILED; exit 1
