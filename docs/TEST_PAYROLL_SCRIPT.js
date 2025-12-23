// ==================================
// SCRIPT COMPLETO DE PRUEBA DEL MÓDULO DE NÓMINA
// Ejecutar en la consola del navegador (F12)
// ==================================

const API_URL = 'http://localhost:8080';
const CUSTOMER_ID = 1;

// Paso 1: Generar datos demo
console.log('📦 Paso 1: Generando datos demo...');
fetch(`${API_URL}/api/hr/demo/generate?customerId=${CUSTOMER_ID}`, { method: 'POST' })
    .then(r => r.text())
    .then(msg => {
        console.log('✅ Datos creados:', msg);
        return fetch(`${API_URL}/api/hr/employees?customerId=${CUSTOMER_ID}&page=0&size=10`);
    })
    .then(r => r.json())
    .then(employees => {
        console.log('👥 Empleados disponibles:', employees.totalElements);
        console.table(employees.content.map(e => ({
            Nombre: e.fullName,
            Puesto: e.jobTitle,
            Salario: `$${e.baseSalary}`
        })));

        // Paso 2: Crear periodo
        console.log('\n📅 Paso 2: Creando periodo de nómina...');
        return fetch(`${API_URL}/api/hr/periods?customerId=${CUSTOMER_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                periodType: 'BIWEEKLY',
                periodNumber: 24,
                year: 2025,
                startDate: '2025-12-16',
                endDate: '2025-12-31',
                paymentDate: '2026-01-02',
                description: 'Quincena 24 - Diciembre 2025'
            })
        });
    })
    .then(r => r.json())
    .then(period => {
        console.log('✅ Periodo creado:', period.periodName);
        window.testPeriod = period;

        // Paso 3: Procesar nómina
        console.log('\n💰 Paso 3: Procesando nómina...');
        return fetch(`${API_URL}/api/hr/payroll/periods/${period.id}/process?customerId=${CUSTOMER_ID}`, {
            method: 'POST'
        });
    })
    .then(r => r.json())
    .then(result => {
        console.log('✅ Nómina procesada:', result);

        // Paso 4: Ver recibos
        console.log('\n📄 Paso 4: Consultando recibos generados...');
        return fetch(`${API_URL}/api/hr/payroll/periods/${window.testPeriod.id}/receipts?customerId=${CUSTOMER_ID}`);
    })
    .then(r => r.json())
    .then(receipts => {
        console.log(`✅ ${receipts.length} recibos generados`);
        console.table(receipts.map(r => ({
            Empleado: r.employeeName,
            'Días': r.regularDays,
            'Percepciones': `$${r.totalPerceptions.toFixed(2)}`,
            'Deducciones': `$${r.totalDeductions.toFixed(2)}`,
            'ISR': `$${r.isrAmount.toFixed(2)}`,
            'IMSS': `$${r.imssAmount.toFixed(2)}`,
            'NETO': `$${r.netPay.toFixed(2)}`
        })));

        // Paso 5: Aprobar nómina
        console.log('\n✔️ Paso 5: Aprobando nómina...');
        return fetch(`${API_URL}/api/hr/payroll/periods/${window.testPeriod.id}/approve?customerId=${CUSTOMER_ID}`, {
            method: 'POST'
        });
    })
    .then(r => r.json())
    .then(result => {
        console.log('✅', result.message);

        // Paso 6: Registrar pago
        console.log('\n💸 Paso 6: Registrando pago...');
        return fetch(`${API_URL}/api/hr/payroll/periods/${window.testPeriod.id}/pay?customerId=${CUSTOMER_ID}`, {
            method: 'POST'
        });
    })
    .then(r => r.json())
    .then(result => {
        console.log('✅', result.message);
        console.log('\n🎉 ¡PROCESO COMPLETO! La nómina ha sido pagada exitosamente.\n');
    })
    .catch(err => {
        console.error('❌ Error:', err);
    });
