    mongosh --eval "db.dropDatabase();" looma
    mongorestore  --nsInclude  looma.*  C:\xampp\htdocs\Looma\mongo-dump\dump\
    mongoimport   --file=C:\xampp\htdocs\Looma\mongo-dump\logins\defaultlogins.json --db=loomausers --collection=logins