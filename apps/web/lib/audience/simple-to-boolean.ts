import { Group, Condition } from './schema/boolean-filters.schema';
import { getFieldByKey } from './schema/field-registry';

// Convert simple filters to boolean expression
export function simpleToBoolean(simple: Record<string, any>): Group {
  const children: Condition[] = [];

  // Helper function to add a condition if the value is not empty
  const addConditionIfValid = (category: Condition['category'], fieldKey: string, op: string, value: unknown) => {
    if (value !== undefined && value !== null && value !== '' && 
        (Array.isArray(value) ? value.length > 0 : true)) {
      const field = getFieldByKey(fieldKey);
      if (field) {
        children.push({
          kind: 'condition',
          category,
          field: fieldKey,
          op,
          value
        });
      }
    }
  };

  // Process audience filters
  if (simple.audience) {
    const { audience } = simple;
    
    // B2B filters
    if (audience.b2b && audience.businessProfile) {
      const { businessProfile } = audience;
      
      if (businessProfile.companyName) {
        addConditionIfValid('business', 'business.company_name', 'contains', businessProfile.companyName);
      }
      
      if (businessProfile.jobTitle) {
        addConditionIfValid('business', 'business.job_title', 'contains', businessProfile.jobTitle);
      }
      
      if (businessProfile.seniority && businessProfile.seniority.length > 0) {
        addConditionIfValid('business', 'business.seniority', 'in', businessProfile.seniority);
      }
      
      if (businessProfile.department && businessProfile.department.length > 0) {
        addConditionIfValid('business', 'business.department', 'in', businessProfile.department);
      }
      
      if (businessProfile.employeeCount) {
        const { min, max } = businessProfile.employeeCount;
        if (min !== undefined || max !== undefined) {
          const range: [number, number] = [min || 0, max || 1000000];
          addConditionIfValid('business', 'business.employee_count', 'between', range);
        }
      }
      
      if (businessProfile.revenue) {
        const { min, max } = businessProfile.revenue;
        if (min !== undefined || max !== undefined) {
          const range: [number, number] = [min || 0, max || 1000000000];
          addConditionIfValid('business', 'business.revenue', 'between', range);
        }
      }
      
      if (businessProfile.industry && businessProfile.industry.length > 0) {
        addConditionIfValid('business', 'business.industry', 'in', businessProfile.industry);
      }
    }
  }

  // Process segment filters (intent)
  if (simple.segment && simple.segment.length > 0) {
    addConditionIfValid('intent', 'intent.topics', 'matchAny', simple.segment);
  }

  // Process date filters
  if (simple.daysBack) {
    addConditionIfValid('date', 'date.days_back', 'eq', simple.daysBack);
  }

  // Process financial filters
  if (simple.financial) {
    const { financial } = simple;
    
    if (financial.estimatedIncome) {
      const { min, max } = financial.estimatedIncome;
      if (min !== undefined || max !== undefined) {
        const range: [number, number] = [min || 0, max || 1000000];
        addConditionIfValid('financial', 'financial.estimated_income', 'between', range);
      }
    }
  }

  // Process personal filters
  if (simple.personal) {
    const { personal } = simple;
    
    if (personal.age) {
      const { min, max } = personal.age;
      if (min !== undefined || max !== undefined) {
        const range: [number, number] = [min || 0, max || 120];
        addConditionIfValid('personal', 'personal.age', 'between', range);
      }
    }
    
    if (personal.gender && personal.gender.length > 0) {
      addConditionIfValid('personal', 'personal.gender', 'in', personal.gender);
    }
  }

  // Process family filters
  if (simple.family) {
    const { family } = simple;
    
    if (family.childrenCount) {
      const { min, max } = family.childrenCount;
      if (min !== undefined || max !== undefined) {
        const range: [number, number] = [min || 0, max || 20];
        addConditionIfValid('family', 'family.children_count', 'between', range);
      }
    }
  }

  // Process housing filters
  if (simple.housing) {
    const { housing } = simple;
    
    if (housing.ownershipStatus && housing.ownershipStatus.length > 0) {
      addConditionIfValid('housing', 'housing.ownership_status', 'in', housing.ownershipStatus);
    }
  }

  // Process location filters
  if (simple.location) {
    const { location } = simple;
    
    if (location.country && location.country.length > 0) {
      addConditionIfValid('location', 'location.country', 'in', location.country);
    }
    
    if (location.region && location.region.length > 0) {
      addConditionIfValid('location', 'location.region', 'in', location.region);
    }
    
    if (location.city && location.city.length > 0) {
      addConditionIfValid('location', 'location.city', 'in', location.city);
    }
  }

  // Process contact filters
  if (simple.contact) {
    const { contact } = simple;
    
    if (contact.hasEmail !== undefined) {
      addConditionIfValid('contact', 'contact.has_email', contact.hasEmail ? 'isTrue' : 'isFalse', true);
    }
    
    if (contact.hasPhone !== undefined) {
      addConditionIfValid('contact', 'contact.has_phone', contact.hasPhone ? 'isTrue' : 'isFalse', true);
    }
    
    if (contact.hasLinkedin !== undefined) {
      addConditionIfValid('contact', 'contact.has_linkedin', contact.hasLinkedin ? 'isTrue' : 'isFalse', true);
    }
  }

  return {
    kind: 'group',
    op: 'AND',
    children
  };
} 