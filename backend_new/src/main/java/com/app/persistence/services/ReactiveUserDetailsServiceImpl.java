package com.app.persistence.services;

import com.app.persistence.repository.UserRepository;
import com.app.persistence.repository.RoleRepository;
import com.app.persistence.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReactiveUserDetailsServiceImpl implements ReactiveUserDetailsService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Override
    public Mono<UserDetails> findByUsername(String username) {
        return userRepository.findByUsername(username)
                .flatMap(user -> {
                    return roleRepository.findRolesByUserId(user.getId())
                            .flatMap(role -> {
                                return permissionRepository.findPermissionsByRoleId(role.getId())
                                        .map(perm -> new SimpleGrantedAuthority("PERMISSION_" + perm.getName()))
                                        .concatWith(Mono.just(new SimpleGrantedAuthority("ROLE_" + role.getName())));
                            })
                            .collectList()
                            .map(authorities -> User.builder()
                                    .username(user.getUsername())
                                    .password(user.getPassword())
                                    .authorities(authorities)
                                    .disabled(!user.isEnabled())
                                    .accountExpired(!user.isAccountNoExpired())
                                    .accountLocked(!user.isAccountNoLocked())
                                    .credentialsExpired(!user.isCredentialNoExpired())
                                    .build());
                });
    }
}
