#!/bin/sh
        mongo --eval "db.dropDatabase();" looma
        mongorestore --quiet --db looma "C:\xampp\htdocs\Looma\mongo-dump\dump\looma\"
