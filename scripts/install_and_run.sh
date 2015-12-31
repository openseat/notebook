#!/bin/bash
set -e
set -x

rm -rf /usr/local/share/jupyter/nbextensions/openseat-notebook/

cd /opt/openseat-notebook
python setup.py develop
jupyter nbextension install openseatnotebook/static/openseat-notebook --symlink
jupyter nbextension enable openseat-notebook/js/widget_conceptor

cd /home/jovyan/work
ipython notebook --no-browser --ip=*
