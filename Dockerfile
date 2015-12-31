FROM jupyter/minimal-notebook
VOLUME /opt/openseat-notebook

# Why?
RUN mkdir /root/.jupyter

COPY ./requirements.txt /src/openseat-notebook/
RUN conda install -y \
  --file /src/openseat-notebook/requirements.txt

COPY . /src/openseat-notebook
RUN cd /src/openseat-notebook \
  && python3 setup.py install \
  && jupyter nbextension install openseatnotebook/static/openseat-notebook

COPY ./scripts/install_and_run.sh /
COPY notebooks/* /home/jovyan/work/
