# bitespeed Task

### API:
#### Create Order/Customer:
- Running on localhost 3000
    - Create new
   ```sh
   curl --location 'http://localhost:3000/' \
    --header 'Content-Type: application/json' \
    --data-raw '{
      "phoneNumber" : "717171",
      "email" : "george@hillvalley.edu"
    }'
   ```

  - Get identity
  ```sh
  curl --location 'http://localhost:3000/identity' \
    --header 'Content-Type: application/json' \
    --data-raw '{
      "phoneNumber" : "717171",
      "email" : "george@hillvalley.edu"
    }'
   ```
  
Created By Zain Mansuri 🐉