# PostgreSQL image with the pg_ivm extension installed.
FROM postgres:latest

RUN apt-get update && apt-get install -y \
    build-essential \
    postgresql-server-dev-all \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/sraoss/pg_ivm.git /tmp/pg_ivm \
    && cd /tmp/pg_ivm \
    && make \
    && make install \
    && rm -rf /tmp/pg_ivm

RUN apt-get purge -y build-essential postgresql-server-dev-all git \
    && apt-get autoremove -y