
import React from 'react';
import { FinancialSettings, ConditionalFinancialRule, ConditionOperator, FinancialRuleType, OtherChargeSetting, OtherChargeBasis, CustomChargeSetting } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '../ui/Toast';
import { SHOW_DELETE } from '../../features';

interface AdminFinancialSettingsProps {
  settings: FinancialSettings;
  onUpdateSettings: (updatedSettings: FinancialSettings) => void;
}

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  greater_than_or_equal_to: '>=',
  greater_than: '>',
  less_than_or_equal_to: '<=',
  less_than: '<',
  between: 'is between',
};

const OTHER_CHARGE_BASIS_LABELS: Record<OtherChargeBasis, string> = {
  fixedAmount: 'Fixed Amount',
  basicSalePrice: '% of Basic Sale Price',
  totalConsideration: '% of Total Consideration',
  saleableArea: 'Per Sqft of Saleable Area',
};

type ChargeKey = 'societyFormationCharges' | 'legalCharges' | 'maintenanceCharges' | 'corpusFund';

const AdminFinancialSettings: React.FC<AdminFinancialSettingsProps> = ({ settings, onUpdateSettings }) => {
  const [formData, setFormData] = React.useState(settings);

  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSimpleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: Number(value) || 0 }));
  };

  const handleRuleChange = (ruleId: string, field: keyof Omit<ConditionalFinancialRule, 'id'>, value: string, ruleType: 'stampDuty' | 'registration') => {
    const rulesKey = ruleType === 'stampDuty' ? 'stampDutyRules' : 'registrationRules';
    setFormData(prev => ({
        ...prev,
        [rulesKey]: prev[rulesKey].map(rule => {
            if (rule.id === ruleId) {
                let updatedRule: any = { ...rule };

                if (field === 'operator' || field === 'ruleType') {
                    updatedRule[field] = value;
                } else {
                    updatedRule[field] = Number(value) || 0;
                }

                if (field === 'operator' && value !== 'between') {
                    delete updatedRule.value2;
                }
                if (field === 'operator' && value === 'between' && updatedRule.value2 === undefined) {
                    updatedRule.value2 = updatedRule.value;
                }
                
                if (field === 'ruleType') {
                    if (value === 'fixed') {
                        delete updatedRule.percentage;
                        if (updatedRule.fixedAmount === undefined) updatedRule.fixedAmount = 0;
                    } else { // 'percentage'
                        delete updatedRule.fixedAmount;
                        if (updatedRule.percentage === undefined) updatedRule.percentage = 0;
                    }
                }

                return updatedRule;
            }
            return rule;
        })
    }));
  };

  const handleAddRule = (ruleType: 'stampDuty' | 'registration') => {
    const newRule: ConditionalFinancialRule = {
      id: uuidv4(),
      operator: 'greater_than_or_equal_to',
      value: 0,
      ruleType: 'percentage',
      percentage: 0,
    };
    const rulesKey = ruleType === 'stampDuty' ? 'stampDutyRules' : 'registrationRules';
    setFormData(prev => ({
      ...prev,
      [rulesKey]: [...prev[rulesKey], newRule]
    }));
  };

  const handleDeleteRule = (ruleId: string, ruleType: 'stampDuty' | 'registration') => {
    const rulesKey = ruleType === 'stampDuty' ? 'stampDutyRules' : 'registrationRules';
    if ((formData[rulesKey]).length <= 1) {
        toast.error("At least one rule is required.");
        return;
    }
    setFormData(prev => ({
      ...prev,
      [rulesKey]: prev[rulesKey].filter(rule => rule.id !== ruleId)
    }));
  };
  
  const handleOtherChargeChange = (
    chargeKey: ChargeKey,
    field: keyof OtherChargeSetting,
    value: string | boolean
  ) => {
    setFormData(prev => {
      const newChargeSetting = { ...prev[chargeKey] };

      if (field === 'basis') {
        newChargeSetting.basis = value as OtherChargeBasis;
      } else if (field === 'applyGst') {
        newChargeSetting.applyGst = value as boolean;
        if (value === false) {
          delete newChargeSetting.gstPercentage; // Reset custom GST when unchecked
        }
      } else {
        (newChargeSetting[field as keyof Omit<OtherChargeSetting, 'basis' | 'applyGst'>] as number) = Number(value) || 0;
      }

      return { ...prev, [chargeKey]: newChargeSetting };
    });
  };
  
  // Custom Charges Handlers
  const handleAddCustomCharge = () => {
      const newCharge: CustomChargeSetting = {
          id: uuidv4(),
          name: 'New Charge',
          basis: 'fixedAmount',
          value: 0,
          applyGst: false,
          partOfTotalConsideration: false
      };
      setFormData(prev => ({
          ...prev,
          customCharges: [...(prev.customCharges || []), newCharge]
      }));
  };

  const handleDeleteCustomCharge = (id: string) => {
      setFormData(prev => ({
          ...prev,
          customCharges: prev.customCharges.filter(c => c.id !== id)
      }));
  };

  const handleCustomChargeChange = (id: string, field: keyof CustomChargeSetting, value: string | boolean) => {
       setFormData(prev => ({
          ...prev,
          customCharges: prev.customCharges.map(c => {
              if (c.id === id) {
                  const updatedCharge = { ...c };
                  if (field === 'name') updatedCharge.name = value as string;
                  else if (field === 'basis') updatedCharge.basis = value as OtherChargeBasis;
                  else if (field === 'applyGst') {
                      updatedCharge.applyGst = value as boolean;
                      if (value === false) delete updatedCharge.gstPercentage;
                  }
                  else if (field === 'partOfTotalConsideration') updatedCharge.partOfTotalConsideration = value as boolean;
                  else if (field === 'value' || field === 'gstPercentage') updatedCharge[field] = Number(value) || 0;
                  
                  return updatedCharge;
              }
              return c;
          })
      }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    toast.success('Financial settings saved.');
  };

  const RuleEditor: React.FC<{
      rule: ConditionalFinancialRule;
      ruleType: 'stampDuty' | 'registration';
  }> = ({ rule, ruleType }) => (
      <div className="p-3 bg-[var(--dark-bg)] rounded-md flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-sm text-[var(--text-secondary)]">IF Total Consideration is</span>
          <select value={rule.operator} onChange={e => handleRuleChange(rule.id, 'operator', e.target.value, ruleType)} className="p-2 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] text-sm">
              {Object.entries(OPERATOR_LABELS).map(([op, label]) => <option key={op} value={op}>{label}</option>)}
          </select>
          <input type="number" placeholder="Value" value={rule.value} onChange={e => handleRuleChange(rule.id, 'value', e.target.value, ruleType)} className="p-2 w-28 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] text-sm" />
          {rule.operator === 'between' && (
              <>
                  <span className="text-sm text-[var(--text-secondary)]">and</span>
                  <input type="number" placeholder="Value 2" value={rule.value2 || ''} onChange={e => handleRuleChange(rule.id, 'value2', e.target.value, ruleType)} className="p-2 w-28 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] text-sm" />
              </>
          )}
          <span className="text-sm text-[var(--text-secondary)]">THEN fee is</span>
          <select value={rule.ruleType} onChange={e => handleRuleChange(rule.id, 'ruleType', e.target.value, ruleType)} className="p-2 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] text-sm">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
          </select>
          {rule.ruleType === 'percentage' ? (
              <div className="flex items-center">
                  <input type="number" step="0.01" placeholder="%" value={rule.percentage || ''} onChange={e => handleRuleChange(rule.id, 'percentage', e.target.value, ruleType)} className="p-2 w-20 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] text-sm" />
                  <span className="ml-2 text-lg text-[var(--text-secondary)]">%</span>
              </div>
          ) : (
              <div className="flex items-center">
                  <span className="mr-2 text-lg text-[var(--text-secondary)]">₹</span>
                  <input type="number" placeholder="Amount" value={rule.fixedAmount || ''} onChange={e => handleRuleChange(rule.id, 'fixedAmount', e.target.value, ruleType)} className="p-2 w-28 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] text-sm" />
              </div>
          )}
          {SHOW_DELETE && <button type="button" onClick={() => handleDeleteRule(rule.id, ruleType)} className="ml-auto text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-[var(--light-bg)]" title="Delete Rule">
              <i className="fas fa-trash-alt"></i>
          </button>}
      </div>
  );
  
  const OtherChargeEditor: React.FC<{
      chargeKey: ChargeKey;
      label: string;
      setting: OtherChargeSetting;
  }> = ({ chargeKey, label, setting }) => (
      <div className="p-3 bg-[var(--dark-bg)] rounded-md flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-x-3 gap-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)] w-full sm:w-48 flex-shrink-0">{label}</label>
          <select value={setting.basis} onChange={e => handleOtherChargeChange(chargeKey, 'basis', e.target.value)} className="p-2 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] text-sm">
             {Object.entries(OTHER_CHARGE_BASIS_LABELS).map(([basis, label]) => <option key={basis} value={basis}>{label}</option>)}
          </select>
          <div className="flex items-center">
              <input type="number" step="0.01" value={setting.value} onChange={e => handleOtherChargeChange(chargeKey, 'value', e.target.value)} className="p-2 w-28 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] text-sm" />
              {setting.basis.includes('Percentage') && <span className="ml-2 text-lg text-[var(--text-secondary)]">%</span>}
          </div>
          {chargeKey === 'maintenanceCharges' && (
             <div className="flex items-center">
                <span className="text-sm text-[var(--text-secondary)] mr-2">for</span>
                <input type="number" value={setting.months || ''} onChange={e => handleOtherChargeChange(chargeKey, 'months', e.target.value)} className="p-2 w-20 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] text-sm" />
                <span className="ml-2 text-sm text-[var(--text-secondary)]">months</span>
             </div>
          )}
          <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] sm:ml-auto">
            <label className="flex items-center gap-2 cursor-pointer">
                <input 
                    type="checkbox" 
                    checked={setting.applyGst} 
                    onChange={e => handleOtherChargeChange(chargeKey, 'applyGst', e.target.checked)} 
                    className="h-4 w-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] bg-[var(--dark-bg)]"
                />
                Apply GST
            </label>
            {setting.applyGst && (
                <div className="flex items-center">
                    <input 
                        type="number" 
                        step="0.01"
                        placeholder={formData.gstPercentage.toString()}
                        value={setting.gstPercentage ?? ''} 
                        onChange={e => handleOtherChargeChange(chargeKey, 'gstPercentage', e.target.value)}
                        className="p-1 w-20 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] text-sm"
                    />
                    <span className="ml-1 text-lg text-[var(--text-secondary)]">%</span>
                </div>
            )}
        </div>
      </div>
  );
  
    const CustomChargeEditor: React.FC<{
        charge: CustomChargeSetting;
    }> = ({ charge }) => (
      <div className="p-3 bg-[var(--dark-bg)] rounded-md flex flex-col gap-3 relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-x-3 gap-y-2">
              <input 
                type="text" 
                value={charge.name} 
                onChange={e => handleCustomChargeChange(charge.id, 'name', e.target.value)} 
                placeholder="Charge Name"
                className="p-2 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] text-sm w-full sm:w-48 font-medium"
              />
              
              <select value={charge.basis} onChange={e => handleCustomChargeChange(charge.id, 'basis', e.target.value)} className="p-2 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] text-sm">
                 {Object.entries(OTHER_CHARGE_BASIS_LABELS).map(([basis, label]) => <option key={basis} value={basis}>{label}</option>)}
              </select>
              
              <div className="flex items-center">
                  <input type="number" step="0.01" value={charge.value} onChange={e => handleCustomChargeChange(charge.id, 'value', e.target.value)} className="p-2 w-28 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] text-sm" />
                  {charge.basis.includes('Percentage') && <span className="ml-2 text-lg text-[var(--text-secondary)]">%</span>}
              </div>
    
              <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] sm:ml-auto pr-10">
                <label className="flex items-center gap-2 cursor-pointer" title="Add this charge to Total Consideration (Agreement Value)">
                    <input 
                        type="checkbox" 
                        checked={charge.partOfTotalConsideration || false} 
                        onChange={e => handleCustomChargeChange(charge.id, 'partOfTotalConsideration', e.target.checked)} 
                        className="h-4 w-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] bg-[var(--dark-bg)]"
                    />
                    Add to Total Consideration
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={charge.applyGst} 
                        onChange={e => handleCustomChargeChange(charge.id, 'applyGst', e.target.checked)} 
                        className="h-4 w-4 rounded border-gray-300 text-[var(--primary-color)] focus:ring-[var(--primary-color)] bg-[var(--dark-bg)]"
                    />
                    Apply GST
                </label>
                {charge.applyGst && (
                    <div className="flex items-center">
                        <input 
                            type="number" 
                            step="0.01"
                            placeholder={formData.gstPercentage.toString()}
                            value={charge.gstPercentage ?? ''} 
                            onChange={e => handleCustomChargeChange(charge.id, 'gstPercentage', e.target.value)}
                            className="p-1 w-20 rounded-md border border-[var(--light-bg)] bg-[var(--medium-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)] text-sm"
                        />
                        <span className="ml-1 text-lg text-[var(--text-secondary)]">%</span>
                    </div>
                )}
            </div>
            {SHOW_DELETE && <button type="button" onClick={() => handleDeleteCustomCharge(charge.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-[var(--light-bg)]" title="Delete Charge">
                  <i className="fas fa-trash-alt"></i>
            </button>}
          </div>
      </div>
  );


  return (
    <div className="p-4 bg-[var(--medium-bg)] rounded-lg shadow-md h-full flex flex-col">
      <h3 className="text-xl font-bold mb-6 text-[var(--text-primary)]">Financial Settings</h3>

      <div className="flex-1 overflow-y-auto pr-2">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          <p className="text-sm text-[var(--text-secondary)] bg-[var(--dark-bg)] p-4 rounded-md border border-[var(--light-bg)]">
            These settings will be used to automatically calculate charges in the RERA Booking Form.
          </p>
          
          {/* GST */}
          <fieldset className="border border-[var(--light-bg)] p-6 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-[var(--text-primary)]">Static Percentages</legend>
            <div className="space-y-4 mt-4 max-w-sm">
              <div>
                <label htmlFor="gstPercentage" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Global GST Percentage</label>
                <div className="flex items-center">
                  <input type="number" step="0.01" id="gstPercentage" name="gstPercentage" value={formData.gstPercentage} onChange={handleSimpleChange} required className="w-full p-3 rounded-md border border-[var(--light-bg)] bg-[var(--dark-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-color)]" />
                  <span className="ml-2 text-lg text-[var(--text-secondary)]">%</span>
                </div>
              </div>
            </div>
          </fieldset>
          
          {/* Other Dynamic Charges */}
          <fieldset className="border border-[var(--light-bg)] p-6 rounded-lg">
             <legend className="px-2 text-lg font-semibold text-[var(--text-primary)]">Other Dynamic Charges</legend>
             <div className="space-y-4 mt-4">
                <h4 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Standard Charges</h4>
                <OtherChargeEditor chargeKey="societyFormationCharges" label="Society Formation" setting={formData.societyFormationCharges} />
                <OtherChargeEditor chargeKey="legalCharges" label="Legal Charges" setting={formData.legalCharges} />
                <OtherChargeEditor chargeKey="maintenanceCharges" label="Maintenance Charges" setting={formData.maintenanceCharges} />
                <OtherChargeEditor chargeKey="corpusFund" label="Corpus Fund" setting={formData.corpusFund} />

                <div className="border-t border-[var(--light-bg)] my-4 pt-4">
                    <div className="flex justify-between items-center mb-4">
                         <h4 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">Custom Charges</h4>
                         <button type="button" onClick={handleAddCustomCharge} className="text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                             <i className="fas fa-plus"></i> Add Custom Charge
                         </button>
                    </div>
                    <div className="space-y-4">
                        {formData.customCharges && formData.customCharges.length > 0 ? (
                            formData.customCharges.map(charge => (
                                <CustomChargeEditor key={charge.id} charge={charge} />
                            ))
                        ) : (
                            <p className="text-sm text-[var(--text-secondary)] italic text-center">No custom charges added.</p>
                        )}
                    </div>
                </div>
             </div>
          </fieldset>
          
          {/* Stamp Duty Rules */}
          <fieldset className="border border-[var(--light-bg)] p-6 rounded-lg">
             <legend className="px-2 text-lg font-semibold text-[var(--text-primary)]">Conditional Stamp Duty Rules</legend>
             <div className="space-y-4 mt-4">
                {formData.stampDutyRules.map(rule => (
                    <RuleEditor key={rule.id} rule={rule} ruleType="stampDuty" />
                ))}
                <button type="button" onClick={() => handleAddRule('stampDuty')} className="text-sm px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white">+ Add Rule</button>
             </div>
          </fieldset>
          
          {/* Registration Rules */}
          <fieldset className="border border-[var(--light-bg)] p-6 rounded-lg">
             <legend className="px-2 text-lg font-semibold text-[var(--text-primary)]">Conditional Registration Rules</legend>
             <div className="space-y-4 mt-4">
                {formData.registrationRules.map(rule => (
                    <RuleEditor key={rule.id} rule={rule} ruleType="registration" />
                ))}
                <button type="button" onClick={() => handleAddRule('registration')} className="text-sm px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white">+ Add Rule</button>
             </div>
          </fieldset>
          
          <div className="flex justify-end pt-6 mt-6 border-t border-[var(--light-bg)]">
            <button type="submit" className="px-6 py-2 rounded-md bg-[var(--primary-color)] text-white font-medium hover:bg-[#128c7e] transition-colors">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminFinancialSettings;
