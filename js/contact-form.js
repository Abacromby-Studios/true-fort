// Form submission handler
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('supportForm');
    const submitBtn = document.getElementById('submitBtn');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Disable button during submission
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        try {
            // Prepare form data
            const formData = new FormData(form);
            const payload = {};
            formData.forEach((value, key) => { payload[key] = value });
            
            // Send to server
            const response = await fetch('/api/submit-form', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            // Handle response
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Server error');
            }
            
            // Success
            document.getElementById('formContainer').classList.add('hidden');
            document.getElementById('successMessage').classList.remove('hidden');
            
        } catch (error) {
            console.error('Submission error:', error);
            alert(`Failed to submit: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Request';
        }
    });
    
    // Field visibility toggling (keep your existing logic)
    document.getElementById('subject').addEventListener('change', showRelevantFields);
});
