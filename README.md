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

    To create your own full version of Looma, you need:

0. have Apache, PHP, mongoDB [with the mongo PHP driver installed] running on your host (usually 'localhost')

1. these code files

2. the Looma media files which should be in ../content relative to the Looma code

3. a loaded mongoDB database called "looma"

3a. open the mongo-dump folder in this repository on your server system

3b. in terminal "cd" to the mongo-dump folder

3c. in terminal "mongorestore --db looma looma"

    Now point your browser to "localhost" and open the "Looma" folder
