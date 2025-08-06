printf '{"name":"테스트 짐보관소 2","address":"서울시 강남구 테헤란로 123","location":{"type":"Point","coordinates":[127.0276,37.4979]},"openTime":"09:00","closeTime":"22:00","is24Hours":false,"smallPrice":5000,"largePrice":8000,"description":"강남역 근처에 새로 생긴 짐보관소입니다."}' | curl -X POST \
  https://my-luggage-app.duckdns.org/api/storages \
  -H 'Content-Type: application/json' \
  -d @-