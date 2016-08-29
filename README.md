BuggyGui
======

Work in progress for a generalized web gui for buggies.

Server Dependencies
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

Test Client Dependencies
------

In addition to the dependencies above, you will also need:
1. **OpenCV3**. Open source computer vision library for python. OpenCV2 doesn't
   support Python3, so it's necessary to use OpenCV2. There are a number of
   guides available to do this, such as [this]
   (http://www.pyimagesearch.com/2015/07/20/install-opencv-3-0-and-python-3-4-on-ubuntu/).
   After that's done, you should be able to do the following with no errors:

   ```
   import numpy as np
   import cv2
   # Video capture is optional, but it makes the client cooler.
   camera = cv2.VideoCapture(0)
   camera.read()
   ```

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
