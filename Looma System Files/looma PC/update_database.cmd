    mongo --eval "db.dropDatabase();" looma
    mongorestore  --nsInclude  looma.*  C:\xampp\htdocs\Looma\mongo-dump\dump\
    mongoimport   --file=C:\xampp\htdocs\Looma\mongo-dump\extra\extra.json --db=loomausers --collection=logins