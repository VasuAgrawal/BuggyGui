FROM ubuntu:16.04
MAINTAINER Vasu Agrawal 

# ======================= PROTOBUF ======================
# Everything inside here should be self contained.

# Protobuf dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-dev \
    python3-setuptools \
    autoconf \
    automake \
    libtool \
    curl \
    make \
    g++ \
    unzip \
    git

# Build and install protoc for python and C++, and clean up afterward.
WORKDIR /tmp
RUN git clone https://github.com/google/protobuf.git  \
    && cd protobuf  \
    && ./autogen.sh  \
    && ./configure --prefix=/usr  \
    && make -j8  \
    && make check -j8  \
    && make install  \
    && ldconfig  \
    && cd python  \
    && python3 setup.py build  \
    && python3 setup.py test \
    && python3 setup.py install --cpp_implementation \
    && cd / \
    && rm -r /tmp/*

# ======================= TORNADO ======================

# Install tornado.
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-setuptools
RUN pip3 install tornado

# ======================= OPENCV ======================
# Note that this doesn't install with the cuda toolkit. Oh well.
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    wget \
    unzip \
    ffmpeg \
    libgtk-3-dev \
    pkg-config \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    python3-dev \
    python3-numpy \
    libtbb2 \
    libtbb-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libjasper-dev \
    libdc1394-22 \
    libdc1394-22-dev

WORKDIR /tmp
RUN wget https://github.com/opencv/opencv/archive/3.1.0.zip \
    && unzip 3.1.0.zip \
    && cd opencv-3.1.0 \
    && mkdir build \
    && cd build \
    && cmake -D CMAKE_BUILD_TYPE=RELEASE -D CMAKE_INSTALL_PREFIX=/usr \
        -D BUILD_EXAMPLES=OFF \
        .. \
    && make -j8 \
    && make install \
    && cd / \
    && rm -r /tmp/
