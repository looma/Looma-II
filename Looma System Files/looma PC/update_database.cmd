#!/bin/sh
    mongo --eval "db.dropDatabase();" looma
    mongorestore --quiet --db looma "C:\xampp\htdocs\Looma\mongo-dump\dump\looma\"

    mongoimport --file=C:\xampp\htdocs\Looma\mongo-dump/extra/extra.json --db=loomausers --collection=logins