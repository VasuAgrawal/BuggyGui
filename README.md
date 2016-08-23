BuggyGui
======

Work in progress for a generalized web gui for buggies.

Dependencies
------
1. **Python 3.5**. Previous versions won't work, since this uses `async` and
   `await`. On Ubuntu, install as follows:
  
  ```
  sudo apt install python3
  ```
1. **[Tornado](http://www.tornadoweb.org/en/stable/)**. High performance
   asynchronous web server for Python. Install using pip as follows:

  ```
  sudo pip3 install tornado
  ```
1. **[Google Protocol Buffers (Protobufs)]
   (https://github.com/google/protobuf)**.
   Follow the install instructions at the link. You need to build and install 
   the C++ version to get `protoc` in addition to the Python version. The Python
   version provided will work for both Python 2 and Python 3.

Usage
------

For testing / development, you can run the following two processes (preferrably
in separate terminals with i.e. tmux).

```
$ ./test_client.py # In one terminal.
$ ./tcp_server.py # In another terminal.
```

Then, in the browser, navigate to
[`http://localhost:8080`](http://localhost:8080).

The server is configured to be in debug mode for now, which, among other things,
means that if you change any of the files that the server depends on it should
restart automatically. If that doesn't work, CTRL-C will kill the client and
server safely.
