package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.PayrollReceiptDetail;
import com.app.starter1.persistence.entity.PayrollReceipt;
import com.app.starter1.persistence.entity.PayrollConcept;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayrollReceiptDetailRepository extends JpaRepository<PayrollReceiptDetail, Long> {

    List<PayrollReceiptDetail> findByPayrollReceiptOrderBySortOrder(PayrollReceipt payrollReceipt);

    List<PayrollReceiptDetail> findByPayrollReceiptAndConceptType(
            PayrollReceipt payrollReceipt,
            PayrollConcept.ConceptType conceptType);

    void deleteByPayrollReceipt(PayrollReceipt payrollReceipt);
}
