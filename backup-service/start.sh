#!/bin/bash

# Iniciar cron
service cron start

# Iniciar Apache en primer plano
apache2-foreground
