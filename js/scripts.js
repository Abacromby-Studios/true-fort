// Function to show relevant fields based on selected subject
function showRelevantFields() {
    // Hide all subject-specific fields first
    document.querySelectorAll('.subject-fields').forEach(field => {
        field.style.display = 'none';
    });
    
    // Get selected subject
    const subject = document.getElementById('subject').value;
    
    // Show relevant fields
    if (subject) {
        const fieldsId = subject + 'Fields';
        const fieldsElement = document.getElementById(fieldsId);
        if (fieldsElement) {
            fieldsElement.style.display = 'block';
        }
    }
}

// Form validation
document.getElementById('supportForm').addEventListener('submit', function(event) {
    // Basic validation is handled by HTML5 required attribute
    // Additional validation can be added here if needed
    
    // For file uploads, we could add additional checks
    const subject = document.getElementById('subject').value;
    if (subject === 'player_report') {
        const fileInput = document.getElementById('violation_evidence');
        if (fileInput.files.length === 0) {
            alert('Please upload evidence for player reports');
            event.preventDefault();
            return;
        }
        
        // Check file size (also checked server-side)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (fileInput.files[0].size > maxSize) {
            alert('File size must be less than 50MB');
            event.preventDefault();
            return;
        }
    }
    
    // If everything is valid, the form will submit
});

// Initialize the form display on page load
document.addEventListener('DOMContentLoaded', function() {
    showRelevantFields();
    
    // Check for error messages in URL (from PHP redirect)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
        alert('There were errors with your submission. Please check all required fields and try again.');
    }
});
