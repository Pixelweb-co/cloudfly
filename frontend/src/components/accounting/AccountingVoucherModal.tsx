
import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@mui/material";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    Paper,
    Chip
} from "@mui/material";
import axiosInstance from '@/utils/axiosInstance';

interface AccountingEntry {
    id: number;
    lineNumber: number;
    accountCode: string;
    accountName: string;
    description: string;
    debitAmount: number;
    creditAmount: number;
    thirdPartyName?: string;
    costCenterName?: string;
}

interface AccountingVoucher {
    id: number;
    voucherNumber: string;
    voucherType: string;
    date: string;
    totalDebit: number;
    totalCredit: number;
    status: string;
    entries: AccountingEntry[];
}

interface AccountingVoucherModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    voucherId: number | null;
}

export function AccountingVoucherModal({ open, onOpenChange, voucherId }: AccountingVoucherModalProps) {
    const [voucher, setVoucher] = useState<AccountingVoucher | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && voucherId) {
            fetchVoucher(voucherId);
        } else {
            setVoucher(null);
            setError(null);
        }
    }, [open, voucherId]);

    const fetchVoucher = async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get(`/accounting/vouchers/${id}`);
            setVoucher(response.data);
        } catch (err: any) {
            console.error("Error fetching voucher", err);
            setError("Error al cargar el comprobante contable.");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value);
    };

    return (
        <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="md" fullWidth>
            <DialogTitle>Movimientos Contables</DialogTitle>
            <DialogContent>


                {loading && <div className="p-4 text-center">Cargando...</div>}
                {error && <div className="p-4 text-red-500 text-center">{error}</div>}

                {voucher && !loading && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                                <span className="font-semibold block">Número:</span>
                                {voucher.voucherNumber}
                            </div>
                            <div>
                                <span className="font-semibold block">Fecha:</span>
                                {voucher.date}
                            </div>
                            <div>
                                <span className="font-semibold block">Tipo:</span>
                                <Chip label={voucher.voucherType} variant="outlined" size="small" />
                            </div>
                            <div>
                                <span className="font-semibold block">Estado:</span>
                                <Chip
                                    label={voucher.status}
                                    color={voucher.status === 'POSTED' ? 'success' : 'default'}
                                    size="small"
                                />
                            </div>
                        </div>

                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Cuenta</TableCell>
                                        <TableCell>Descripción</TableCell>
                                        <TableCell>Tercero</TableCell>
                                        <TableCell align="right">Débito</TableCell>
                                        <TableCell align="right">Crédito</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {voucher.entries.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell>
                                                <div className="font-medium">{entry.accountCode}</div>
                                                <div className="text-xs text-gray-500">{entry.accountName}</div>
                                            </TableCell>
                                            <TableCell>{entry.description}</TableCell>
                                            <TableCell className="text-xs">{entry.thirdPartyName || '-'}</TableCell>
                                            <TableCell align="right">{formatCurrency(entry.debitAmount)}</TableCell>
                                            <TableCell align="right">{formatCurrency(entry.creditAmount)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="font-bold bg-gray-50">
                                        <TableCell colSpan={3} align="right" style={{ fontWeight: 'bold' }}>Totales:</TableCell>
                                        <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatCurrency(voucher.totalDebit)}</TableCell>
                                        <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatCurrency(voucher.totalCredit)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
