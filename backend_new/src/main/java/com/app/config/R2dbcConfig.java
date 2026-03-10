package com.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.data.r2dbc.convert.R2dbcCustomConversions;
import org.springframework.data.r2dbc.dialect.MySqlDialect;
import org.springframework.lang.NonNull;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class R2dbcConfig {

    @Bean
    public R2dbcCustomConversions r2dbcCustomConversions() {
        List<Converter<?, ?>> converters = new ArrayList<>();
        converters.add(new BitToBooleanConverter());
        converters.add(new BooleanToBitConverter());
        return R2dbcCustomConversions.of(MySqlDialect.INSTANCE, converters);
    }

    @ReadingConverter
    public static class BitToBooleanConverter implements Converter<ByteBuffer, Boolean> {
        @Override
        public Boolean convert(@NonNull ByteBuffer source) {
            if (source == null || source.remaining() == 0) {
                return null;
            }
            byte b = source.get();
            return b != 0;
        }
    }

    @WritingConverter
    public static class BooleanToBitConverter implements Converter<Boolean, ByteBuffer> {
        @Override
        public ByteBuffer convert(@NonNull Boolean source) {
            if (source == null) {
                return null;
            }
            ByteBuffer buffer = ByteBuffer.allocate(1);
            buffer.put((byte) (source ? 1 : 0));
            buffer.flip();
            return buffer;
        }
    }
}
