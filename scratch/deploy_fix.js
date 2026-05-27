const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const content = `package com.app.persistence.repository;

import com.app.persistence.entity.RoleEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface RoleRepository extends ReactiveCrudRepository<RoleEntity, Long> {
    @Query("SELECT * FROM roles WHERE role_name = :name")
    Mono<RoleEntity> findByName(String name);

    @Query("SELECT r.* FROM roles r INNER JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = :userId")
    Flux<RoleEntity> findRolesByUserId(Long userId);
}
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/apps/cloudfly/backend_new/src/main/java/com/app/persistence/repository/RoleRepository.java');
    writeStream.on('close', () => {
      console.log('File uploaded successfully');
      conn.exec('cd /apps/cloudfly && docker compose -f docker-compose-full-vps.yml build backend-api && docker compose -f docker-compose-full-vps.yml up -d backend-api', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          console.log('Backend rebuilt and restarted');
          conn.end();
        });
      });
    });
    writeStream.end(content);
  });
}).connect({
  host: 'api.cloudfly.com.co',
  port: 22,
  username: 'root',
  password: 'Elian20200916',
  readyTimeout: 20000
});
