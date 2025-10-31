package com.app.starter1.dto;

public class OverviewStats {
    private long solicitudes;
    private long clientes;
    private long equipos;
    private long reportes;

    public OverviewStats(long solicitudes, long clientes, long equipos, long reportes) {
        this.solicitudes = solicitudes;
        this.clientes = clientes;
        this.equipos = equipos;
        this.reportes = reportes;
    }

    public long getSolicitudes() { return solicitudes; }
    public long getClientes() { return clientes; }
    public long getEquipos() { return equipos; }
    public long getReportes() { return reportes; }
}
