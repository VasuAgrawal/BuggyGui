BuggyGui
======

Work in progress for a generalized web gui for buggies.

Docker Container Development
======

Instead of getting all of the dependencies installed on your local machine, the
more cross platform solution is to use something akin to a VM with all of the
dependencies preconfigured. Docker containers effectively let you get the
advantage of automated VM configuration without all of the downsides of running
a guest OS inside your OS. This enables higher performance, faster startup, and
overall better experience.

Docker Installation
------
Install Docker by following some of [these instructions]
(https://www.digitalocean.com/community/tutorials/how-to-run-nginx-in-a-docker-container-on-ubuntu-14-04).

You can build the Docker image for the server with all of the necessary
dependencies by doing the following the appropriate
[instructions for your platform]
(https://docs.docker.com/engine/installation/).

You'll then need to install Docker compose. Depending on your OS, this may or
may not be necessary, as in some cases it's included with the Docker
installation above. If you need to install it separately, [see this link]
( https://docs.docker.com/compose/install/ ).

After both items are installed, you should be able to run the following:

```
$ docker -v
$ docker-compose -v
```

Finally, you need to do one more thing: build the server image. This will take
some time as it needs to build a 1.3GB image. After the first time you build it,
it shouldn't need to build again. Each of the docker images mounts the repo as a
read-only directory, so any updates to the code will be visible on a restart.

```
$ cd docker
$ docker build . --tag pythonado
```

Basic Usage
------
The server can be started on a computer using the following command, and can be
killed with CTRL+C.

```
$ docker-compose -f docker/server/docker-compose.yml up
```

You can then run the Test Client from a [separate terminal]
(https://tmux.github.io/), in a similar manner to the above. It can also be
killed with CTRL+C. Note that you don't need to install dependencies on your
computer anymore.

```
$ docker-compose -f docker/client/docker-compose.yml up
```

Various arguments can be passed into the Test Client to force it to connect to a
remote server, to turn on sensors, etc. Execute the following to get more
information on how to trigger the various sensors. You shouldn't need to have
any of the dependencies installed on your local machine to do this. You can also
do it from a Docker container if you so desire.

```
$ ./test_client.py --help
```

You can then navigate to [`http://localhost`](http://localhost) to see it.

FAQ
------

* Make sure that your Docker and docker-compose versions match! The stock docker
  installed in Ubuntu 14.04 isn't new enough. You'll likely need to install both
  of them from source.
