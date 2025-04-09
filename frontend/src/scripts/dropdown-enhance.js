/**
 * Enhanced dropdown styling script
 * This script helps enhance option hover styling for select elements
 */

document.addEventListener('DOMContentLoaded', function() {
  // Add event listeners to all select elements with the enhanced-select class
  const selects = document.querySelectorAll('select.enhanced-select');
  
  selects.forEach(select => {
    // Add mouseover event to each option when the select is opened
    select.addEventListener('mousedown', function() {
      // Use setTimeout to ensure this runs after the dropdown opens
      setTimeout(() => {
        const options = document.querySelectorAll('option');
        
        options.forEach(option => {
          option.addEventListener('mouseover', function() {
            this.style.backgroundColor = '#4f46e5';
            this.style.color = 'white';
            this.style.fontWeight = 'bold';
            this.style.textDecoration = 'underline';
            this.style.borderLeft = '4px solid #818cf8';
            this.style.paddingLeft = '15px';
            this.style.transform = 'scale(1.05)';
          });
          
          option.addEventListener('mouseout', function() {
            if (!this.selected) {
              this.style.backgroundColor = '';
              this.style.color = '';
              this.style.fontWeight = '';
              this.style.textDecoration = '';
              this.style.borderLeft = '';
              this.style.paddingLeft = '';
              this.style.transform = '';
            }
          });
        });
      }, 10);
    });
  });
});