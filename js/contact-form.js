// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Field visibility toggling
    const subjectSelect = document.getElementById('subject');
    subjectSelect.addEventListener('change', toggleSubjectFields);
    
    // Set initial field visibility
    toggleSubjectFields();
    
    // Form submission handler
    document.getElementById('supportForm').addEventListener('submit', handleFormSubmit);
});

function toggleSubjectFields() {
    // Hide all subject fields first
    document.querySelectorAll('.subject-fields').forEach(field => {
        field.classList.add('hidden');
    });
    
    // Show only the selected subject's fields
    const selectedSubject = document.getElementById('subject').value;
    if (selectedSubject) {
        const fieldsToShow = document.getElementById(`${selectedSubject}_fields`);
        if (fieldsToShow) {
            fieldsToShow.classList.remove('hidden');
        }
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    
    // Disable button during submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    try {
        // Collect ALL form data (including hidden fields)
        const formData = new FormData(e.target);
        const payload = {};
        
        // Convert FormData to object and remove empty values
        formData.forEach((value, key) => {
            if (value) payload[key] = value;
        });
        
        // Send to server
        const response = await fetch('/api/submit-form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Server error');
        }
        
        // Show success message
        document.getElementById('formContainer').classList.add('hidden');
        document.getElementById('successMessage').classList.remove('hidden');
    } catch (error) {
        console.error('Submission error:', error);
        alert(`Error: ${error.message || 'Failed to submit form'}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Request';
    }
}

// Reset form after successful submission
function resetForm() {
    document.getElementById('supportForm').reset();
    document.getElementById('successMessage').classList.add('hidden');
    document.getElementById('formContainer').classList.remove('hidden');
    toggleSubjectFields();
}
