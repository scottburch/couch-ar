#!/bin/sh
export NODE_PATH=`pwd`/../node_modules/jasmine-node/lib:`pwd`/../
../node_modules/jasmine-node/bin/jasmine-node spec

