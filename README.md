# Looma-II
Developer profile:
    Created and maintained by Skip [skip@looma.education]
    For Looma Education Company, Menlo Park CA

README:
Looma II source code

    This GITHUB repository does not include the Looma "content" which is 64+GB, and growing, of media files used in Looma.
    For access to the content send requests to info at villagetechsolutions dot org.

This is the Looma code developed by Looma Education Corporation (looma.education).
It is copyright Looma Education, but licensed under Creative Commons (CC-BY-NC-SA).

The Looma interface can be viewed online at http://looma.website.

Send comments and suggestions to info at looma dot education.

## Instructions for running Looma locally:

* Ensure you are on an amd64 or arm64 Mac or Linux machine
* Download and install [Docker](https://www.docker.com/products/docker-desktop/)
* In the project root, run `./looma build` (Could take several minutes the first time)
    * This builds the two Docker images, loomaweb and loomadb
* In the project root, run `./looma run`
    * This runs docker-compose
* Navigate to [localhost:48080](http://localhost:48080) in your browser

