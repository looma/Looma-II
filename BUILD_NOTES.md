# Build Notes

## Building containers 

The containers built are:
- loomaweb
- loomadb

To build both the containers, Please execute the `make` as folloes:

```bash
% make all
```
Let's see the images got built

```bash
% docker images
REPOSITORY  TAG       IMAGE ID       CREATED         SIZE
loomaweb    latest    9511dda9872d   34 hours ago    1.07GB
loomadb     latest    1e99a5667143   34 hours ago    759MB
```

## Executing the containers

Please use the `loomarun.sh` script to `bootup` and `shutdown` both the containers. 
Let's `bootup` first.
```bash
% ./loomarun.sh bootup
```
Here during `bootup`, the script brings up both the containers in their own 
little private networks using `docker compose ...`

```bash
% docker compose -f docker-compose.yml up --no-color --detach
```
Now you can lok at the running state of the tiny cluster
```bash
% ./loomarun.sh status
```

Now you can browse looma at [localhost looma](http://localhost:8080)

We can shutdown the tiny cluster of containers  similarly

```bash
% ./loomarun.sh shutdown
```

It uses `docker compose ..` to bring down the cluster
```bash
% docker compose -f docker-compose.yml down --volumes
```

