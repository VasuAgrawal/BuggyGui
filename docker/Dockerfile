FROM ubuntu:16.04

# Start by installing Python3, pip, and setuptools.
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-setuptools \
    && apt-get -y clean all \
    && rm -rf /var/lib/apt/lists/*

# ======================= TORNADO ======================

# Install tornado.
RUN pip3 install tornado

# ======================= PROTOBUF ======================

# Protobuf dependencies
RUN apt-get update && apt-get install -y \
    autoconf \
    automake \
    libtool \
    curl \
    make \
    g++ \
    unzip \
    git \
    && apt-get -y clean all \
    && rm -rf /var/lib/apt/lists/*

# Build and install protoc for python and C++
RUN cd /tmp \
    && git clone https://github.com/google/protobuf.git  \
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
    && python3 setup.py install --cpp_implementation

# ======================= OPENCV ======================
# Borrowed from https://hub.docker.com/r/elenaalexandrovna/opencv-python3/

RUN apt-get update && \
    apt-get install -y \
    build-essential \
    cmake \
    git \
    wget \
    unzip \
    pkg-config \
    libswscale-dev \
    python3-dev \
    python3-numpy \
    libtbb2 \
    libtbb-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libjasper-dev \
    libavformat-dev \
    && apt-get -y clean all \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /
RUN wget https://github.com/Itseez/opencv/archive/3.0.0.zip \
    && unzip 3.0.0.zip \
    && mkdir /opencv-3.0.0/cmake_binary \
    && cd /opencv-3.0.0/cmake_binary \
    && cmake .. \
    && make install \
    && rm /3.0.0.zip \
    && rm -r /opencv-3.0.0
