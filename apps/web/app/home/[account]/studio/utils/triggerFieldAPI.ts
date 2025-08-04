// utils/triggerFieldAPI.ts

export async function validateEmail(email: string): Promise<string> {
  try {
    // For demo purposes, we'll simulate an API call
    // In production, this would call a real email validation service
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    
    // Simple email validation logic
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'invalid';
    }
    
    // Simulate different validation results
    const random = Math.random();
    if (random < 0.3) return 'valid';
    if (random < 0.6) return 'disposable';
    if (random < 0.8) return 'invalid';
    return 'unknown';
  } catch (error) {
    console.error('Email validation error:', error);
    return 'error';
  }
}

export async function validateURL(url: string): Promise<string> {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Simple URL validation
    try {
      new URL(url);
      return 'valid';
    } catch {
      return 'invalid';
    }
  } catch (error) {
    console.error('URL validation error:', error);
    return 'error';
  }
}

export async function enrichCompany(domain: string): Promise<string> {
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate company enrichment
    const companies = ['Tech Corp', 'Innovation Inc', 'Digital Solutions', 'Future Systems'];
    const random = Math.floor(Math.random() * companies.length);
    return companies[random] || 'Unknown';
  } catch (error) {
    console.error('Company enrichment error:', error);
    return 'Unknown';
  }
}

export async function getJobSeniority(jobTitle: string): Promise<string> {
  try {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Simple seniority detection based on job title
    const title = jobTitle.toLowerCase();
    if (title.includes('senior') || title.includes('lead') || title.includes('manager')) {
      return 'Senior';
    } else if (title.includes('junior') || title.includes('associate')) {
      return 'Junior';
    } else if (title.includes('director') || title.includes('vp') || title.includes('head')) {
      return 'Executive';
    }
    return 'Mid-level';
  } catch (error) {
    console.error('Seniority detection error:', error);
    return 'Unknown';
  }
} 