package com.app.starter1;

import com.app.starter1.persistence.entity.PermissionEntity;
import com.app.starter1.persistence.entity.RoleEntity;
import com.app.starter1.persistence.entity.RoleEnum;
import com.app.starter1.persistence.entity.UserEntity;
import com.app.starter1.persistence.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Role;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Set;

@SpringBootApplication
public class Starter1Application {

	public static void main(String[] args) {
		SpringApplication.run(Starter1Application.class, args);
	}



	@Bean
	CommandLineRunner init(UserRepository userRepository) {

	return args -> {

		PermissionEntity createPermission = PermissionEntity.builder().
				name("CREATE").
				build();

		PermissionEntity readPermission = PermissionEntity.builder().
				name("READ").
				build();

		PermissionEntity updatePermission = PermissionEntity.builder().
				name("UPDATE").
				build();

		PermissionEntity deletePermission = PermissionEntity.builder().
				name("DELETE").
				build();


		//Create Roles
		RoleEntity roleSuperAdmin = RoleEntity.builder().
				roleEnum(RoleEnum.SUPERADMIN).
				permissionList(Set.of(createPermission,readPermission,updatePermission,deletePermission)).
				build();


		RoleEntity roleAdmin = RoleEntity.builder().
				roleEnum(RoleEnum.ADMIN).
				permissionList(Set.of(createPermission,readPermission,updatePermission,deletePermission)).
				build();


		//create super admin user
		UserEntity SuperAdminuser = UserEntity.builder().
		username("Ingenieria").
		password("Ingenieria1234").
		accountNoExpired(true).
		accountNoLocked(true).
		isEnabled(true).
		credentialNoExpired(true).
		roles(Set.of(roleSuperAdmin))
		.build();

		//userRepository.save(SuperAdminuser);


	};
	}
}
