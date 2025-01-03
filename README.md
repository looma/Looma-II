# Looma-II
Developer profile:
    Created and maintained by Skip [skip@looma.education]
    For Looma Education Company, Menlo Park CA

README:
Looma II source code

    This GITHUB repository does not include the Looma "content" which is 64+GB, and growing, of media files used in Looma.
    For access to the content send requests to info at looma dot education.

This is the Looma code developed by Looma Education Corporation (looma.education).
It is copyright Looma Education, but licensed under Creative Commons (CC-BY-NC-SA).

The Looma interface can be viewed online at http://looma.website.

Send comments and suggestions to info at looma dot education.

## Instructions for running Looma locally (Setup):

* Ensure you are on an amd64 or arm64 Mac or Linux machine
* Download, install and run [Docker](https://www.docker.com/products/docker-desktop/) so the Docker daemon is running
* `git clone https://github.com/looma/Looma-II` [this repo]

* In the project root, run `make` (Could take several minutes the first time)
    * This builds the two Docker images, loomaweb and loomadb
* In the project root, run `docker-compose up`
    * This runs docker-compose, and creates "loomaweb" and "loomadb" containers and runs them

If you get errors about docker authentication, run `docker logout`
    
* Navigate to [localhost:48080](http://localhost:48080) in your browser to use Looma
* Navigate to [localhost:47017](localhost:47017) to see that mongoDB is running

[MongoDB Compass (click to download)](https://www.mongodb.com/docs/compass/current/install/) is recommended for viewing the database.
