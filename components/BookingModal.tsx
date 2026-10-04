
import React from 'react';
import { User, Lead, Project, InventoryUnit, ParkingSlot, BookingDetails, Applicant, PaymentPlan, FinancialSettings, CalculationBasis, ConditionalFinancialRule, OtherChargeSetting, OtherChargeBasis, PriceBreakup, FormFieldConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { defaultCustomerDocs } from '../constants';
import DynamicFieldRenderer from './DynamicFieldRenderer';
import { Modal, Button, inputCls, textareaCls } from './ui/Modal';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmBooking: (leadId: string, bookingDetails: BookingDetails) => void;
  onUpdateBooking?: (leadId: string, bookingDetails: BookingDetails) => void;
  lead: Lead | null;
  bookingToEdit?: BookingDetails | null;
  project: Project | null;
  paymentPlans: PaymentPlan[];
  financialSettings: FinancialSettings;
  formConfigs: FormFieldConfig[];
  users?: User[];
}

const FormField: React.FC<{label: string, id: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void, type?: string, required?: boolean, disabled?: boolean, children?: React.ReactNode}> =
({ label, id, value, onChange, type = 'text', required = false, disabled = false, children }) => (
    <div>
        <label htmlFor={id} className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            {label}{required && <span className="text-red-500"> *</span>}
        </label>
        {children || <input type={type} id={id} name={id} value={value} onChange={onChange} required={required} disabled={disabled} autoComplete="off" className={inputCls()} />}
    </div>
);

const calculateFee = (
  totalConsideration: number,
  rules: ConditionalFinancialRule[]
): { amount: number; detail: string } => {
    const sortedRules = [...rules].sort((a, b) => {
        const opPriority = (op: ConditionalFinancialRule['operator']) => {
            if (op === 'between') return 1;
            if (op.startsWith('greater')) return 2;
            if (op.startsWith('less')) return 3;
            return 4; 
        };

        const priorityA = opPriority(a.operator);
        const priorityB = opPriority(b.operator);

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        if (a.operator.startsWith('greater')) {
            return b.value - a.value;
        }
        if (a.operator.startsWith('less')) {
            return a.value - b.value;
        }
        
        return a.value - b.value;
    });

    for (const rule of sortedRules) {
        let conditionMet = false;
        switch (rule.operator) {
            case 'less_than':
                if (totalConsideration < rule.value) conditionMet = true;
                break;
            case 'less_than_or_equal_to':
                if (totalConsideration <= rule.value) conditionMet = true;
                break;
            case 'greater_than':
                if (totalConsideration > rule.value) conditionMet = true;
                break;
            case 'greater_than_or_equal_to':
                if (totalConsideration >= rule.value) conditionMet = true;
                break;
            case 'between':
                if (rule.value2 !== undefined && totalConsideration >= rule.value && totalConsideration <= rule.value2) {
                    conditionMet = true;
                }
                break;
        }

        if (conditionMet) {
            if (rule.ruleType === 'fixed') {
                const amount = rule.fixedAmount || 0;
                return { amount, detail: `₹${amount.toLocaleString('en-IN')}` };
            }
            if (rule.ruleType === 'percentage') {
                const percentage = rule.percentage || 0;
                const amount = totalConsideration * (percentage / 100);
                return { amount, detail: `${percentage}%` };
            }
        }
    }
    return { amount: 0, detail: 'Not Applicable' }; 
}

const calculateOtherCharge = (
  chargeSetting: OtherChargeSetting,
  bsp: number,
  tc: number,
  area: number,
): number => {
  if (!chargeSetting) return 0;
  switch (chargeSetting.basis) {
    case 'fixedAmount':
      return chargeSetting.value;
    case 'basicSalePrice':
      return bsp * (chargeSetting.value / 100);
    case 'totalConsideration':
      return tc * (chargeSetting.value / 100);
    case 'saleableArea':
      const total = area * chargeSetting.value;
      if (chargeSetting.months && chargeSetting.months > 0) {
        return total * chargeSetting.months;
      }
      return total;
    default:
      return 0;
  }
};

const ApplicantForm: React.FC<{
    applicant: Applicant; 
    isPrimary: boolean;
    onApplicantChange: (id: string, field: keyof Applicant, value: any) => void;
}> = ({ applicant, isPrimary, onApplicantChange }) => (
    <div className="space-y-3">
         <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="Full Name" id={`fullName-${applicant.id}`} value={applicant.fullName} onChange={e => onApplicantChange(applicant.id, 'fullName', e.target.value)} required />
            {!isPrimary && <FormField label="Relation with Primary Applicant" id={`relationshipWithPrimary-${applicant.id}`} value={applicant.relationshipWithPrimary || ''} onChange={e => onApplicantChange(applicant.id, 'relationshipWithPrimary', e.target.value)} />}
         </div>
         <div className="grid sm:grid-cols-3 gap-3">
            <FormField label="S/o, W/o, D/o" id={`relationValue-${applicant.id}`} value={applicant.relationValue} onChange={e => onApplicantChange(applicant.id, 'relationValue', e.target.value)} required />
            <FormField label="Date of Birth" id={`dob-${applicant.id}`} value={applicant.dob} onChange={e => onApplicantChange(applicant.id, 'dob', e.target.value)} type="date" required />
            <FormField label="Nationality" id={`nationality-${applicant.id}`} value={applicant.nationality} onChange={e => onApplicantChange(applicant.id, 'nationality', e.target.value)} required />
         </div>
         <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="PAN Card" id={`pan-${applicant.id}`} value={applicant.pan} onChange={e => onApplicantChange(applicant.id, 'pan', e.target.value)} required />
            <FormField label="Aadhaar Card" id={`aadhaar-${applicant.id}`} value={applicant.aadhaar} onChange={e => onApplicantChange(applicant.id, 'aadhaar', e.target.value)} required />
         </div>
         <FormField label="Present Address" id={`presentAddress-${applicant.id}`} value={applicant.presentAddress} onChange={e => onApplicantChange(applicant.id, 'presentAddress', e.target.value)} required >
            <textarea id={`presentAddress-${applicant.id}`} name={`presentAddress-${applicant.id}`} value={applicant.presentAddress} onChange={e => onApplicantChange(applicant.id, 'presentAddress', e.target.value)} required rows={2} className={inputCls()} />
         </FormField>
         <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input type="checkbox" checked={applicant.isSameAddress} onChange={e => onApplicantChange(applicant.id, 'isSameAddress', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] bg-[var(--dark-bg)]" />
            Permanent address is same as present address
         </label>
         {!applicant.isSameAddress && (
             <FormField label="Permanent Address" id={`permanentAddress-${applicant.id}`} value={applicant.permanentAddress} onChange={e => onApplicantChange(applicant.id, 'permanentAddress', e.target.value)} required>
                <textarea id={`permanentAddress-${applicant.id}`} name={`permanentAddress-${applicant.id}`} value={applicant.permanentAddress} onChange={e => onApplicantChange(applicant.id, 'permanentAddress', e.target.value)} required rows={2} className={inputCls()} />
             </FormField>
         )}
         <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="Mobile number (hidden)" id={`mobile-${applicant.id}`} value={applicant.mobile} onChange={e => onApplicantChange(applicant.id, 'mobile', e.target.value)} type="password" required />
            <FormField label="Email ID" id={`email-${applicant.id}`} value={applicant.email} onChange={e => onApplicantChange(applicant.id, 'email', e.target.value)} type="email" required />
         </div>
         <div className="grid sm:grid-cols-2 gap-3">
            <FormField label="Occupation" id={`occupation-${applicant.id}`} value={applicant.occupation} onChange={e => onApplicantChange(applicant.id, 'occupation', e.target.value)} required />
         </div>
    </div>
);


const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onConfirmBooking, onUpdateBooking, lead, bookingToEdit, project, paymentPlans, financialSettings, formConfigs, users = [] }) => {
    const [currentStep, setCurrentStep] = React.useState(0);
    const [bookingData, setBookingData] = React.useState<BookingDetails | null>(null);
    const [selectedUnit, setSelectedUnit] = React.useState<InventoryUnit | null>(null);
    const [calculationBasis, setCalculationBasis] = React.useState<CalculationBasis>('rate');
    const [isBasisLocked, setIsBasisLocked] = React.useState(false);
    const [costDetails, setCostDetails] = React.useState({ stampDuty: '', registration: '' });
    const [formError, setFormError] = React.useState<string | null>(null);
    const formRef = React.useRef<HTMLFormElement>(null);
    const [activeInput, setActiveInput] = React.useState<{ id: string; value: string } | null>(null);

    const hasInitialized = React.useRef(false);
    const lastBookingId = React.useRef<string | null>(null);

    const isEditing = !!bookingToEdit;
    const steps = ['applicant', 'property', 'cost', 'plan', 'nominee'];
    const stepLabels = ['Applicant Details', 'Property Selection', 'Cost & Token', 'Payment Plan', 'Nominee & Confirmation'];

    const activeConfigs = React.useMemo(() => (formConfigs || []).filter(c => c.module === 'booking' && c.isVisible), [formConfigs]);
    const customConfigs = React.useMemo(() => activeConfigs.filter(c => !c.isSystem), [activeConfigs]);

    const selectedPaymentPlan = React.useMemo(() => {
        if (!bookingData?.paymentPlanId || !paymentPlans) return null;
        return paymentPlans.find(p => p.id === bookingData.paymentPlanId);
    }, [bookingData?.paymentPlanId, paymentPlans]);

    const projectPaymentPlans = React.useMemo(() => {
        if (!project || !project.paymentPlanIds || !paymentPlans) return [];
        return project.paymentPlanIds.map(id => paymentPlans.find(p => p.id === id)).filter(Boolean) as PaymentPlan[];
    }, [project, paymentPlans]);

    const recalculateCosts = React.useCallback(
      (
        basis: CalculationBasis,
        value: number,
        otherCharges: number
      ): { priceBreakup: PriceBreakup; details: { stampDuty: string; registration: string } } | null => {
        if (!selectedUnit || !financialSettings) return null;

        const { gstPercentage, stampDutyRules, registrationRules } = financialSettings;
        const customChargesSettings = financialSettings.customCharges || [];
        
        let finalTC = 0;
        let bsp = 0;

        if (basis === 'rate') {
            bsp = value * selectedUnit.area;
            // Initial guess for finalTC
            finalTC = bsp + otherCharges;
            // Iterate to handle custom charges that are part of TC
            for (let i = 0; i < 3; i++) {
                let customInTC = 0;
                customChargesSettings.forEach(charge => {
                    if (charge.partOfTotalConsideration) {
                        customInTC += calculateOtherCharge(charge, bsp, finalTC, selectedUnit.area);
                    }
                });
                finalTC = bsp + otherCharges + customInTC;
            }
        } else if (basis === 'consideration') {
            finalTC = value;
            // Initial guess for bsp
            bsp = finalTC - otherCharges;
            // Iterate to handle custom charges that are part of TC and depend on bsp
            for (let i = 0; i < 5; i++) {
                let customInTC = 0;
                customChargesSettings.forEach(charge => {
                    if (charge.partOfTotalConsideration) {
                        customInTC += calculateOtherCharge(charge, bsp, finalTC, selectedUnit.area);
                    }
                });
                bsp = finalTC - otherCharges - customInTC;
            }
        } else if (basis === 'grandTotal') {
            // Iterative solver for grand total
            let estimatedTc = value * 0.8; // Start with 80% as guess
            for (let i = 0; i < 10; i++) {
                // For a given TC, calculate everything else
                const tempBspGuess = estimatedTc - otherCharges; 
                let tempCustomInTC = 0;
                customChargesSettings.forEach(charge => {
                    if (charge.partOfTotalConsideration) {
                        tempCustomInTC += calculateOtherCharge(charge, tempBspGuess, estimatedTc, selectedUnit.area);
                    }
                });
                const refinedBsp = estimatedTc - otherCharges - tempCustomInTC;
                
                const tempSoc = calculateOtherCharge(financialSettings.societyFormationCharges, refinedBsp, estimatedTc, selectedUnit.area);
                const tempLeg = calculateOtherCharge(financialSettings.legalCharges, refinedBsp, estimatedTc, selectedUnit.area);
                const tempMaint = calculateOtherCharge(financialSettings.maintenanceCharges, refinedBsp, estimatedTc, selectedUnit.area);
                const tempCorp = calculateOtherCharge(financialSettings.corpusFund, refinedBsp, estimatedTc, selectedUnit.area);
                
                let totalTempGst = estimatedTc * (gstPercentage / 100);
                const addGst = (chargeSetting: OtherChargeSetting, amount: number) => {
                    if (chargeSetting.applyGst) {
                        const rate = chargeSetting.gstPercentage ?? gstPercentage;
                        totalTempGst += amount * (rate / 100);
                    }
                };
                addGst(financialSettings.societyFormationCharges, tempSoc);
                addGst(financialSettings.legalCharges, tempLeg);
                addGst(financialSettings.maintenanceCharges, tempMaint);
                addGst(financialSettings.corpusFund, tempCorp);
                
                let tempCustomNotInTC = 0;
                customChargesSettings.forEach(charge => {
                    const val = calculateOtherCharge(charge, refinedBsp, estimatedTc, selectedUnit.area);
                    addGst(charge, val);
                    if (!charge.partOfTotalConsideration) {
                        tempCustomNotInTC += val;
                    }
                });

                const tempStampDuty = calculateFee(estimatedTc, stampDutyRules).amount;
                const tempRegCharges = calculateFee(estimatedTc, registrationRules).amount;
                
                const totalOtherCosts = totalTempGst + tempStampDuty + tempRegCharges + tempSoc + tempLeg + tempMaint + tempCorp + tempCustomNotInTC;
                estimatedTc = value - totalOtherCosts;
            }
            finalTC = estimatedTc;
            
            let finalCustomInTC = 0;
            customChargesSettings.forEach(charge => {
                if (charge.partOfTotalConsideration) {
                    finalCustomInTC += calculateOtherCharge(charge, finalTC - otherCharges, finalTC, selectedUnit.area);
                }
            });
            bsp = finalTC - otherCharges - finalCustomInTC;
        }

        const customChargesMap: Record<string, number> = {};
        let customChargesNotInTC = 0;
        
        customChargesSettings.forEach(charge => {
            const val = calculateOtherCharge(charge, bsp, finalTC, selectedUnit.area);
            customChargesMap[charge.name] = val;
            if (!charge.partOfTotalConsideration) {
                customChargesNotInTC += val;
            }
        });

        const societyFormationCharges = calculateOtherCharge(financialSettings.societyFormationCharges, bsp, finalTC, selectedUnit.area);
        const legalCharges = calculateOtherCharge(financialSettings.legalCharges, bsp, finalTC, selectedUnit.area);
        const maintenanceCharges = calculateOtherCharge(financialSettings.maintenanceCharges, bsp, finalTC, selectedUnit.area);
        const corpusFund = calculateOtherCharge(financialSettings.corpusFund, bsp, finalTC, selectedUnit.area);

        let totalGst = finalTC * (gstPercentage / 100);
        const addGstFinal = (chargeSetting: OtherChargeSetting, amount: number) => {
            if (chargeSetting.applyGst) {
                const rate = chargeSetting.gstPercentage ?? gstPercentage;
                totalGst += amount * (rate / 100);
            }
        };
        addGstFinal(financialSettings.societyFormationCharges, societyFormationCharges);
        addGstFinal(financialSettings.legalCharges, legalCharges);
        addGstFinal(financialSettings.maintenanceCharges, maintenanceCharges);
        addGstFinal(financialSettings.corpusFund, corpusFund);
        customChargesSettings.forEach(charge => {
            addGstFinal(charge, customChargesMap[charge.name]);
        });

        const stampDutyResult = calculateFee(finalTC, stampDutyRules);
        const registrationResult = calculateFee(finalTC, registrationRules);
        
        const grandTotal = finalTC + totalGst + stampDutyResult.amount + registrationResult.amount + societyFormationCharges + legalCharges + maintenanceCharges + corpusFund + customChargesNotInTC;

        return {
            priceBreakup: {
                basicSalePrice: bsp,
                floorPLC: 0,
                otherCharges: otherCharges,
                societyFormationCharges,
                legalCharges,
                maintenanceCharges,
                corpusFund,
                customCharges: customChargesMap,
                totalConsideration: finalTC,
                gst: totalGst,
                stampDuty: stampDutyResult.amount,
                registrationCharges: registrationResult.amount,
                grandTotal,
            },
            details: {
                stampDuty: stampDutyResult.detail,
                registration: registrationResult.detail,
            }
        };
      }, [selectedUnit, financialSettings]);

    React.useEffect(() => {
        const bookingId = isEditing ? bookingToEdit?.primaryApplicant?.id : 'new';
        if (isOpen && lead && project && (!hasInitialized.current || lastBookingId.current !== bookingId)) {
            if (isEditing && bookingToEdit) {
                // Bookings made before these two fields existed: the token date and the lead's owner.
                setBookingData({ ...bookingToEdit, bookingDate: bookingToEdit.bookingDate || bookingToEdit.tokenDetails?.transactionDate || new Date().toISOString().split('T')[0], salesExecutiveId: bookingToEdit.salesExecutiveId || lead.ownerId });
            } else {
                const initialBookingData: BookingDetails = {
                    primaryApplicant: {
                        id: uuidv4(),
                        fullName: lead.name,
                        relationValue: '',
                        dob: '',
                        pan: '',
                        aadhaar: '',
                        presentAddress: '',
                        permanentAddress: '',
                        isSameAddress: false,
                        mobile: lead.phone,
                        email: lead.email,
                        occupation: lead.clientProfile || '',
                        nationality: 'Indian',
                        customerDocuments: { ...defaultCustomerDocs },
                    },
                    coApplicants: [],
                    unitId: '',
                    parkingId: '',
                    priceBreakup: {
                        basicSalePrice: 0,
                        floorPLC: 0,
                        otherCharges: 300000, 
                        societyFormationCharges: 0,
                        legalCharges: 0,
                        maintenanceCharges: 0,
                        corpusFund: 0,
                        totalConsideration: 0,
                        gst: 0,
                        stampDuty: 0,
                        registrationCharges: 0,
                        grandTotal: 0,
                    },
                    paymentPlanId: project.paymentPlanIds?.[0] || '',
                    tokenDetails: {
                        amount: lead.tokenAmount || 0,
                        mode: 'NEFT',
                        transactionId: '',
                        bankName: '',
                        transactionDate: new Date().toISOString().split('T')[0],
                    },
                    declarationAccepted: false,
                    bookingDate: new Date().toISOString().split('T')[0],
                    // The person who owns the lead (and so took the site visit) is the sales executive unless it is changed here.
                    salesExecutiveId: lead.ownerId,
                    customData: {},
                };
                setBookingData(initialBookingData);
            }
            setCurrentStep(0);
            setSelectedUnit(null);
            setCalculationBasis('rate');
            setIsBasisLocked(false);
            setCostDetails({ stampDuty: '', registration: '' });
            hasInitialized.current = true;
            lastBookingId.current = bookingId || null;
        }
        
        if (!isOpen) {
            hasInitialized.current = false;
            lastBookingId.current = null;
        }
    }, [isOpen, lead, project, isEditing, bookingToEdit]);
    

    React.useEffect(() => {
        if (bookingData?.unitId && project) {
            const unit = project.inventory.find(u => u.id === bookingData.unitId);
            if (unit) {
                setSelectedUnit(unit);
                const basis = unit.calculationBasis || 'rate';
                
                let basisValue = 0;
                if (basis === 'rate') {
                    basisValue = unit.area > 0 ? unit.price / unit.area : 0;
                } else { 
                    basisValue = unit.price;
                }
                
                setCalculationBasis(basis);
                setIsBasisLocked(!!unit.calculationBasis);
                
                const result = recalculateCosts(basis, basisValue, bookingData.priceBreakup.otherCharges);
                if (result) {
                    setBookingData(prev => prev ? { ...prev, priceBreakup: result.priceBreakup } : null);
                    setCostDetails(result.details);
                }
            } else {
                setSelectedUnit(null);
                 setIsBasisLocked(false);
            }
        } else if (isEditing && bookingToEdit && bookingToEdit.unitId) { 
            const unit = project?.inventory.find(u => u.id === bookingToEdit.unitId);
            if (unit) setSelectedUnit(unit);
        } else {
             setSelectedUnit(null);
             setIsBasisLocked(false);
        }
    }, [bookingData?.unitId, project, recalculateCosts, isEditing, bookingToEdit]);

    const handleCostInputChange = React.useCallback((basis: CalculationBasis, value: string) => {
        setActiveInput({ id: basis, value });
        const numericValue = parseFloat(value) || 0;
        const otherCharges = bookingData?.priceBreakup.otherCharges || 0;
        const result = recalculateCosts(basis, numericValue, otherCharges);
        if (result) {
            setBookingData(prev => prev ? { ...prev, priceBreakup: result.priceBreakup } : null);
            setCostDetails(result.details);
        }
    }, [bookingData, recalculateCosts]);
    
    const handleOtherChargesChange = React.useCallback((value: string) => {
        setActiveInput({ id: 'otherCharges', value });
        const numericValue = parseFloat(value) || 0;
        if (!bookingData) return;

        let currentBasisValue = 0;
        const area = selectedUnit?.area || 1;
        switch(calculationBasis) {
            case 'rate':
                currentBasisValue = (bookingData.priceBreakup.basicSalePrice || 0) / area;
                break;
            case 'consideration':
                currentBasisValue = bookingData.priceBreakup.totalConsideration || 0;
                break;
            case 'grandTotal':
                currentBasisValue = bookingData.priceBreakup.grandTotal || 0;
                break;
        }
        
        const result = recalculateCosts(calculationBasis, currentBasisValue, numericValue);
        if (result) {
            setBookingData(prev => prev ? { ...prev, priceBreakup: result.priceBreakup } : null);
            setCostDetails(result.details);
        }
    }, [bookingData, calculationBasis, selectedUnit, recalculateCosts]);

    const handleApplicantChange = React.useCallback((id: string, field: keyof Applicant, value: any) => {
        setBookingData(prev => {
            if (!prev) return null;
            if (prev.primaryApplicant.id === id) {
                const newPrimary = { ...prev.primaryApplicant, [field]: value };
                if (field === 'isSameAddress' && value === true) {
                    newPrimary.permanentAddress = newPrimary.presentAddress;
                }
                return { ...prev, primaryApplicant: newPrimary };
            }
            const newCoApplicants = prev.coApplicants.map(app => 
                app.id === id ? { ...app, [field]: value } : app
            );
            return { ...prev, coApplicants: newCoApplicants };
        });
    }, []);
    
    const handleAddCoApplicant = React.useCallback(() => {
        setBookingData(prev => prev ? ({
            ...prev,
            coApplicants: [
                ...prev.coApplicants,
                { id: uuidv4(), fullName: '', relationValue: '', dob: '', pan: '', aadhaar: '', presentAddress: '', permanentAddress: '', isSameAddress: false, mobile: '', email: '', occupation: '', nationality: 'Indian', relationshipWithPrimary: '', customerDocuments: { ...defaultCustomerDocs } }
            ]
        }) : null);
    }, []);

    const handleRemoveCoApplicant = React.useCallback((id: string) => {
        setBookingData(prev => prev ? ({
            ...prev,
            coApplicants: prev.coApplicants.filter(app => app.id !== id)
        }) : null);
    }, []);

    const handleSimpleChange = React.useCallback((field: keyof BookingDetails, value: any) => {
        setBookingData(prev => prev ? ({ ...prev, [field]: value }) : null);
    }, []);

    const handleTokenDetailsChange = React.useCallback((field: keyof BookingDetails['tokenDetails'], value: any) => {
        setBookingData(prev => prev ? ({ ...prev, tokenDetails: { ...prev.tokenDetails, [field]: value } }) : null);
    }, []);
    
    const handleNomineeChange = React.useCallback((field: keyof NonNullable<BookingDetails['nominee']>, value: any) => {
         setBookingData(prev => prev ? ({ ...prev, nominee: { ...(prev.nominee || {fullName:'', relationship:'', address:'', contact:''}), [field]: value } }) : null);
    }, []);

    const handleCustomChange = React.useCallback((field: string, value: any) => {
        setBookingData(prev => prev ? ({ ...prev, customData: { ...(prev.customData || {}), [field]: value } }) : null);
    }, []);

    // Each step is checked with the browser's own required-field messages before moving on.
    const stepIsValid = () => { setFormError(null); return formRef.current ? formRef.current.reportValidity() : true; };

    const nextStep = () => {
        if (currentStep < steps.length - 1 && stepIsValid()) {
            setCurrentStep(currentStep + 1);
        }
    };
    
    const prevStep = () => {
        setFormError(null);
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentStep < steps.length - 1) { nextStep(); return; } // Enter inside a field moves to the next step
        if (!stepIsValid()) return;
        if (lead && bookingData && bookingData.unitId && bookingData.parkingId) {
            const finalBookingData = { ...bookingData, declarationAccepted: true };
            if (isEditing && onUpdateBooking) {
                onUpdateBooking(lead.id, finalBookingData);
            } else {
                onConfirmBooking(lead.id, finalBookingData);
            }
        } else {
            setFormError('Choose a unit and a parking slot (step 2) before confirming the booking.');
        }
    };
    
    const availableUnits = project?.inventory.filter(unit => unit.status === 'Available') || [];
    const availableParking = project?.parkingInventory.filter(slot => slot.status === 'Available') || [];
    
    const currentlyBookedUnit = isEditing ? project?.inventory.find(u => u.id === bookingToEdit?.unitId) : null;
    const currentlyBookedParking = isEditing ? project?.parkingInventory.find(p => p.id === bookingToEdit?.parkingId) : null;

    if (!isOpen || !lead || !project || !bookingData) return null;
    
    const totalPercentage = selectedPaymentPlan?.milestones.reduce((sum, m) => sum + m.percentage, 0) || 0;
    
    const isLast = currentStep === steps.length - 1;
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="4xl"
            title={isEditing ? 'Edit booking' : 'Booking form'}
            subtitle={`${lead.name} · ${project.name}`}
            onSubmit={handleSubmit}
            formRef={formRef}
            nativeValidation
            error={formError}
            footer={
                <div className="flex w-full items-center justify-between gap-3">
                    <Button type="button" tone="ghost" onClick={onClose}>Cancel</Button>
                    <div className="flex gap-2">
                        {currentStep > 0 && <Button type="button" tone="ghost" onClick={prevStep}>Back</Button>}
                        {isLast ? <Button type="submit" tone="success">{isEditing ? 'Save changes' : 'Confirm booking'}</Button> : <Button type="submit">Next</Button>}
                    </div>
                </div>
            }
        >
            <ol className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mt-1" aria-label="Booking steps">
                {stepLabels.map((label, i) => (
                    <li key={label} className="flex items-center gap-1.5 shrink-0" aria-current={i === currentStep ? 'step' : undefined}>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${i < currentStep ? 'bg-[var(--primary-color)]/15 text-[var(--primary-color)]' : i === currentStep ? 'bg-[var(--primary-color)] text-white' : 'bg-[var(--light-bg)] text-[var(--text-secondary)]'}`}>
                            {i < currentStep ? <i className="fas fa-check mr-1 text-[9px]" aria-hidden="true"></i> : <span className="mr-1">{i + 1}.</span>}{label}
                        </span>
                        {i < stepLabels.length - 1 && <span className="w-3 h-px bg-[var(--border-color)]"></span>}
                    </li>
                ))}
            </ol>
            <div>
                    {steps[currentStep] === 'applicant' && (
                        <div className="space-y-6">
                            <fieldset className="border border-[var(--light-bg)] p-4 rounded-md">
                                <legend className="px-2 font-semibold text-[var(--text-primary)]">Primary Applicant</legend>
                                <ApplicantForm applicant={bookingData.primaryApplicant} isPrimary={true} onApplicantChange={handleApplicantChange} />
                            </fieldset>
                            {bookingData.coApplicants.map((coApp, index) => (
                                <fieldset key={coApp.id} className="border border-[var(--light-bg)] p-4 rounded-md relative">
                                    <legend className="px-2 font-semibold text-[var(--text-primary)]">Co-Applicant {index + 1}</legend>
                                    <button type="button" onClick={() => handleRemoveCoApplicant(coApp.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-400">&times;</button>
                                    <ApplicantForm applicant={coApp} isPrimary={false} onApplicantChange={handleApplicantChange} />
                                </fieldset>
                            ))}
                            <button type="button" onClick={() => handleAddCoApplicant()} className="text-sm px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white">+ Add Co-Applicant</button>
                        </div>
                    )}
                    
                    {steps[currentStep] === 'property' && (
                        <div className="space-y-4">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Booking Date" id="bookingDate" value={bookingData.bookingDate || ''} onChange={e => handleSimpleChange('bookingDate', e.target.value)} type="date" required />
                                <FormField label="Sales Executive" id="salesExecutiveId" value={bookingData.salesExecutiveId || ''} onChange={e => handleSimpleChange('salesExecutiveId', e.target.value)} required>
                                    <select id="salesExecutiveId" name="salesExecutiveId" value={bookingData.salesExecutiveId || ''} onChange={e => handleSimpleChange('salesExecutiveId', e.target.value)} required className={inputCls()}>
                                        <option value="" disabled>-- Choose --</option>
                                        {users.filter(u => u.isActive || u.id === bookingData.salesExecutiveId).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </FormField>
                             </div>
                             <FormField label="Select Unit" id="unitId" value={bookingData.unitId} onChange={e => handleSimpleChange('unitId', e.target.value)} required>
                                <select id="unitId" name="unitId" value={bookingData.unitId} onChange={e => handleSimpleChange('unitId', e.target.value)} required className={inputCls()}>
                                    <option value="" disabled>-- Choose a unit --</option>
                                    {currentlyBookedUnit && <option key={currentlyBookedUnit.id} value={currentlyBookedUnit.id}>{currentlyBookedUnit.unitNumber} - {currentlyBookedUnit.type} (Currently Selected)</option>}
                                    {availableUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.unitNumber} - {unit.type} ({unit.area} sqft)</option>)}
                                </select>
                             </FormField>
                             {selectedUnit && <div className="text-xs text-[var(--text-secondary)] bg-[var(--dark-bg)] p-2 rounded-md">Floor: {selectedUnit.floor}, Base Price: ₹{selectedUnit.price.toLocaleString('en-IN')}</div>}
                             <FormField label="Select Parking Slot" id="parkingId" value={bookingData.parkingId} onChange={e => handleSimpleChange('parkingId', e.target.value)} required>
                                <select id="parkingId" name="parkingId" value={bookingData.parkingId} onChange={e => handleSimpleChange('parkingId', e.target.value)} required className={inputCls()}>
                                    <option value="" disabled>-- Choose a parking slot --</option>
                                    {currentlyBookedParking && <option key={currentlyBookedParking.id} value={currentlyBookedParking.id}>{currentlyBookedParking.slotNumber} (Currently Selected)</option>}
                                    {availableParking.map(slot => <option key={slot.id} value={slot.id}>{slot.slotNumber} (Level: {slot.level})</option>)}
                                </select>
                            </FormField>
                        </div>
                    )}

                    {steps[currentStep] === 'cost' && (
                        <div className="grid md:grid-cols-2 gap-8 h-full">
                            <div className="flex flex-col h-full">
                                <div className="flex-shrink-0 space-y-4">
                                    <div>
                                        <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">Calculation Basis</h4>
                                        <div className="flex flex-wrap gap-4 p-3 bg-[var(--dark-bg)] rounded-lg mt-2 border border-[var(--light-bg)]">
                                            {(['rate', 'consideration', 'grandTotal'] as CalculationBasis[]).map(basis => (
                                                <label key={basis} className={`flex items-center gap-2 cursor-pointer ${isBasisLocked ? 'cursor-not-allowed opacity-60' : ''}`}>
                                                    <input 
                                                        type="radio" 
                                                        name="calculationBasis" 
                                                        value={basis} 
                                                        checked={calculationBasis === basis} 
                                                        onChange={() => {
                                                            if (!isBasisLocked) {
                                                                setCalculationBasis(basis);
                                                                setActiveInput(null);
                                                            }
                                                        }} 
                                                        disabled={isBasisLocked} 
                                                        className="h-4 w-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)] bg-[var(--dark-bg)] border-[var(--light-bg)]"
                                                    />
                                                    <span className="text-xs font-medium">By {basis.charAt(0).toUpperCase() + basis.slice(1).replace('grandTotal', 'Grand Total').replace('consideration', 'Total Consideration')}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">Enter Value</h4>
                                        <div className="space-y-3 max-w-sm mt-2">
                                            <FormField 
                                                label={`Rate (per ${selectedUnit?.area ? ` ${selectedUnit.area.toLocaleString()} ` : ''} sqft)`} 
                                                id="rate" 
                                                value={activeInput?.id === 'rate' ? activeInput.value : (selectedUnit?.area && selectedUnit.area > 0 ? (bookingData.priceBreakup.basicSalePrice / selectedUnit.area).toFixed(2) : '0')} 
                                                onChange={e => handleCostInputChange('rate', e.target.value)} 
                                                type="number" 
                                                disabled={calculationBasis !== 'rate' || isBasisLocked} 
                                            />
                                            <FormField 
                                                label="Total Consideration" 
                                                id="totalConsideration" 
                                                value={activeInput?.id === 'consideration' ? activeInput.value : bookingData.priceBreakup.totalConsideration.toFixed(0)} 
                                                onChange={e => handleCostInputChange('consideration', e.target.value)} 
                                                type="number" 
                                                disabled={calculationBasis !== 'consideration' || isBasisLocked} 
                                            />
                                            <FormField 
                                                label="Other Charges (Manual)" 
                                                id="otherCharges" 
                                                value={activeInput?.id === 'otherCharges' ? activeInput.value : bookingData.priceBreakup.otherCharges.toString()} 
                                                onChange={e => handleOtherChargesChange(e.target.value)} 
                                                type="number" 
                                            />
                                            <FormField 
                                                label="Grand Total" 
                                                id="grandTotal" 
                                                value={activeInput?.id === 'grandTotal' ? activeInput.value : bookingData.priceBreakup.grandTotal.toFixed(0)} 
                                                onChange={e => handleCostInputChange('grandTotal', e.target.value)} 
                                                type="number" 
                                                disabled={calculationBasis !== 'grandTotal' || isBasisLocked} 
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto pr-2 mt-4 pt-4 border-t border-[var(--light-bg)]">
                                    <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">Booking / Token Amount</h4>
                                    <div className="space-y-3 max-w-sm">
                                        <FormField label="Amount (INR)" id="tokenAmount" value={bookingData.tokenDetails.amount.toString()} onChange={e => handleTokenDetailsChange('amount', Number(e.target.value))} type="number" required />
                                        <FormField label="Payment Mode" id="tokenMode" value={bookingData.tokenDetails.mode} onChange={e => handleTokenDetailsChange('mode', e.target.value)}>
                                            <select id="tokenMode" name="tokenMode" value={bookingData.tokenDetails.mode} onChange={e => handleTokenDetailsChange('mode', e.target.value)} className={inputCls()}><option>NEFT</option><option>RTGS</option><option>Cheque</option><option>UPI</option><option>Other</option></select>
                                        </FormField>
                                        <FormField label="Transaction/Cheque No." id="transactionId" value={bookingData.tokenDetails.transactionId} onChange={e => handleTokenDetailsChange('transactionId', e.target.value)} required />
                                        <FormField label="Bank Name" id="bankName" value={bookingData.tokenDetails.bankName} onChange={e => handleTokenDetailsChange('bankName', e.target.value)} required />
                                        <FormField label="Transaction Date" id="transactionDate" value={bookingData.tokenDetails.transactionDate} onChange={e => handleTokenDetailsChange('transactionDate', e.target.value)} type="date" required />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">Cost Breakup</h4>
                                <div className="flex-1 text-xs space-y-2 bg-[var(--dark-bg)] p-4 rounded-md border border-[var(--light-bg)] mt-2">
                                    <p className="flex justify-between"><span>Basic Sale Price:</span> <span className="font-medium">₹{bookingData.priceBreakup.basicSalePrice.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></p>
                                    <p className="flex justify-between"><span>Other Charges:</span> <span className="font-medium">₹{bookingData.priceBreakup.otherCharges.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></p>
                                    
                                    {bookingData.priceBreakup.customCharges && financialSettings.customCharges?.filter(c => c.partOfTotalConsideration).map(c => (
                                        <p key={c.name} className="flex justify-between text-blue-400"><span>{c.name}:</span> <span className="font-medium">₹{(bookingData.priceBreakup.customCharges?.[c.name] || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></p>
                                    ))}

                                    <p className="flex justify-between font-semibold border-t border-[var(--light-bg)] pt-2 mt-2 text-[var(--text-primary)]"><span>Total Consideration:</span> <span>₹{bookingData.priceBreakup.totalConsideration.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></p>
                                    <p className="flex justify-between mt-2"><span>GST ({financialSettings.gstPercentage}%):</span> <span className="font-medium">₹{bookingData.priceBreakup.gst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></p>
                                    <p className="flex justify-between"><span>Stamp Duty {costDetails.stampDuty && `(${costDetails.stampDuty})`}:</span> <span className="font-medium">₹{bookingData.priceBreakup.stampDuty.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></p>
                                    <p className="flex justify-between"><span>Registration {costDetails.registration && `(${costDetails.registration})`}:</span> <span className="font-medium">₹{bookingData.priceBreakup.registrationCharges.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></p>
                                    <div className="border-t border-[var(--light-bg)] pt-2 mt-2 space-y-2">
                                      <p className="flex justify-between"><span>Society Formation:</span> <span className="font-medium">₹{bookingData.priceBreakup.societyFormationCharges.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></p>
                                      <p className="flex justify-between"><span>Legal Charges:</span> <span className="font-medium">₹{bookingData.priceBreakup.legalCharges.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></p>
                                      <p className="flex justify-between"><span>Maintenance:</span> <span className="font-medium">₹{bookingData.priceBreakup.maintenanceCharges.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></p>
                                      <p className="flex justify-between"><span>Corpus Fund:</span> <span className="font-medium">₹{bookingData.priceBreakup.corpusFund.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></p>
                                      {bookingData.priceBreakup.customCharges && financialSettings.customCharges?.filter(c => !c.partOfTotalConsideration).map(c => (
                                          <p key={c.name} className="flex justify-between"><span>{c.name}:</span> <span className="font-medium">₹{(bookingData.priceBreakup.customCharges?.[c.name] || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></p>
                                      ))}
                                    </div>
                                    <p className="flex justify-between font-bold text-base border-t border-[var(--light-bg)] pt-2 mt-2 text-[var(--primary-color)]"><span>Grand Total:</span> <span>₹{bookingData.priceBreakup.grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {steps[currentStep] === 'plan' && (
                        <div className="space-y-6">
                             <div className="max-w-md">
                                <h4 className="font-semibold text-[var(--text-primary)] mb-2">Select Payment Plan</h4>
                                {projectPaymentPlans.length > 0 ? (
                                    <FormField label="" id="paymentPlanId" value={bookingData.paymentPlanId} onChange={e => handleSimpleChange('paymentPlanId', e.target.value)} required>
                                        <select id="paymentPlanId" name="paymentPlanId" value={bookingData.paymentPlanId} onChange={e => handleSimpleChange('paymentPlanId', e.target.value)} required className={inputCls()}>
                                            {projectPaymentPlans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                                        </select>
                                    </FormField>
                                ) : (
                                    <div className="text-sm text-center bg-[var(--dark-bg)] p-4 rounded-md text-yellow-400 border border-yellow-500/50">
                                        <i className="fas fa-exclamation-triangle mr-2"></i>
                                        No payment plans assigned to this project.
                                    </div>
                                )}
                            </div>

                            <h4 className="font-semibold text-[var(--text-primary)]">Payment Plan Details</h4>
                            {selectedPaymentPlan ? (
                                <div className="text-sm bg-[var(--dark-bg)] p-3 rounded-md border border-[var(--light-bg)] overflow-x-auto">
                                    <h5 className="font-bold mb-2 text-base text-[var(--text-primary)]">{selectedPaymentPlan.name}</h5>
                                    <table className="w-full text-left min-w-[600px]">
                                        <thead>
                                            <tr className="border-b border-[var(--light-bg)]">
                                                <th className="py-2 font-medium text-[var(--text-secondary)]">Milestone</th>
                                                <th className="py-2 font-medium text-[var(--text-secondary)] text-right">Due %</th>
                                                <th className="py-2 font-medium text-[var(--text-secondary)] text-right">Amount</th>
                                                <th className="py-2 font-medium text-[var(--text-secondary)] text-right">GST ({financialSettings.gstPercentage}%)</th>
                                                <th className="py-2 font-medium text-[var(--text-secondary)] text-right">Total Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedPaymentPlan.milestones.map(m => {
                                                const consideration = bookingData.priceBreakup.totalConsideration || 0;
                                                const percentage = m.percentage || 0;
                                                const amount = consideration * (percentage / 100);
                                                const gstPct = financialSettings.gstPercentage || 0;
                                                const gstAmount = amount * (gstPct / 100);
                                                const total = amount + gstAmount;
                                                return (
                                                    <tr key={m.id} className="border-b border-[var(--medium-bg)] last:border-b-0">
                                                        <td className="py-2 pr-2">{m.name}</td>
                                                        <td className="py-2 text-right font-semibold">{m.percentage}%</td>
                                                        <td className="py-2 text-right">₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                        <td className="py-2 text-right">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                        <td className="py-2 text-right font-bold">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-[var(--light-bg)] font-bold">
                                                <td className="py-2">Total</td>
                                                <td className="py-2 text-right">{totalPercentage}%</td>
                                                <td className="py-2 text-right">₹{bookingData.priceBreakup.totalConsideration.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                <td className="py-2 text-right">₹{bookingData.priceBreakup.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                <td className="py-2 text-right">₹{(bookingData.priceBreakup.totalConsideration + bookingData.priceBreakup.gst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-center text-[var(--text-secondary)]">Select a payment plan from the dropdown above to see the details.</p>
                            )}
                        </div>
                    )}

                    {steps[currentStep] === 'nominee' && (
                         <div className="space-y-6 max-w-lg mx-auto">
                            <fieldset className="border border-[var(--light-bg)] p-4 rounded-md">
                                <legend className="px-2 font-semibold text-[var(--text-primary)]">Nominee Details (Optional)</legend>
                                <div className="space-y-3">
                                    <FormField label="Full Name" id="nomineeName" value={bookingData.nominee?.fullName || ''} onChange={e => handleNomineeChange('fullName', e.target.value)} />
                                    <FormField label="Relationship with Applicant" id="nomineeRelationship" value={bookingData.nominee?.relationship || ''} onChange={e => handleNomineeChange('relationship', e.target.value)} />
                                    <FormField label="Address" id="nomineeAddress" value={bookingData.nominee?.address || ''} onChange={e => handleNomineeChange('address', e.target.value)} />
                                    <FormField label="Contact Number" id="nomineeContact" value={bookingData.nominee?.contact || ''} onChange={e => handleNomineeChange('contact', e.target.value)} type="tel" />
                                </div>
                            </fieldset>

                            {customConfigs.length > 0 && (
                                <fieldset className="border border-[var(--light-bg)] p-4 rounded-md">
                                    <legend className="px-2 font-semibold text-[var(--text-primary)]">Additional Details</legend>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {customConfigs.map(config => (
                                            <DynamicFieldRenderer 
                                                key={config.id} 
                                                config={config} 
                                                value={bookingData.customData?.[config.fieldName]} 
                                                onChange={(val) => handleCustomChange(config.fieldName, val)} 
                                            />
                                        ))}
                                    </div>
                                </fieldset>
                            )}
                        </div>
                    )}
                </div>
        </Modal>
    );
};

export default BookingModal;
