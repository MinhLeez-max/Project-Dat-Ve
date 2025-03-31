// Booking related functionality

document.addEventListener('DOMContentLoaded', function() {
  // Seat selection
  const seatMap = document.querySelector('.seat-map');
  const selectedSeatsInput = document.getElementById('selectedSeats');
  const selectedSeatsDisplay = document.getElementById('selectedSeatsDisplay');
  const totalAmountDisplay = document.getElementById('totalAmount');
  const pricePerSeat = document.getElementById('pricePerSeat');
  
  if (seatMap) {
    const seats = seatMap.querySelectorAll('.seat.available');
    let selectedSeats = [];
    
    seats.forEach(seat => {
      seat.addEventListener('click', function() {
        const seatNumber = this.getAttribute('data-seat');
        
        if (this.classList.contains('selected')) {
          // Deselect seat
          this.classList.remove('selected');
          selectedSeats = selectedSeats.filter(s => s !== seatNumber);
        } else {
          // Select seat
          this.classList.add('selected');
          selectedSeats.push(seatNumber);
        }
        
        // Update selected seats input and display
        selectedSeatsInput.value = selectedSeats.join(',');
        selectedSeatsDisplay.textContent = selectedSeats.join(', ') || 'None';
        
        // Update total amount
        if (pricePerSeat && totalAmountDisplay) {
          const price = parseFloat(pricePerSeat.value);
          const total = price * selectedSeats.length;
          totalAmountDisplay.textContent = `${total.toFixed(2)} VND`;
        }
        
        // Enable/disable continue button
        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) {
          continueBtn.disabled = selectedSeats.length === 0;
        }
      });
    });
  }
  
  // Passenger details form
  const passengerDetailsForm = document.getElementById('passengerDetailsForm');
  
  if (passengerDetailsForm) {
    const addPassengerInputs = (numPassengers) => {
      const passengerContainer = document.getElementById('passengerContainer');
      passengerContainer.innerHTML = '';
      
      for (let i = 0; i < numPassengers; i++) {
        const div = document.createElement('div');
        div.className = 'mb-4 p-3 border rounded';
        div.innerHTML = `
          <h5>Passenger ${i + 1} - Seat ${selectedSeatsArray[i]}</h5>
          <div class="mb-3">
            <label for="passengerName${i}" class="form-label">Full Name</label>
            <input type="text" class="form-control" id="passengerName${i}" name="passengerName" required>
          </div>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="passengerAge${i}" class="form-label">Age</label>
              <input type="number" class="form-control" id="passengerAge${i}" name="passengerAge" min="1" max="120" required>
            </div>
            <div class="col-md-6 mb-3">
              <label for="passengerGender${i}" class="form-label">Gender</label>
              <select class="form-select" id="passengerGender${i}" name="passengerGender" required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        `;
        passengerContainer.appendChild(div);
      }
    };
    
    const selectedSeatsElement = document.getElementById('selectedSeatsInput');
    
    if (selectedSeatsElement) {
      const selectedSeatsArray = selectedSeatsElement.value.split(',');
      addPassengerInputs(selectedSeatsArray.length);
    }
  }
  
  // Payment form
  const paymentForm = document.getElementById('paymentForm');
  
  if (paymentForm) {
    const paymentMethodInputs = document.querySelectorAll('input[name="paymentMethod"]');
    const paymentDetailsContainers = document.querySelectorAll('.payment-details');
    
    paymentMethodInputs.forEach(input => {
      input.addEventListener('change', function() {
        // Hide all payment detail containers
        paymentDetailsContainers.forEach(container => {
          container.classList.add('d-none');
        });
        
        // Show the selected payment method details
        const selectedMethod = this.value;
        const selectedContainer = document.getElementById(`${selectedMethod}Details`);
        
        if (selectedContainer) {
          selectedContainer.classList.remove('d-none');
        }
      });
    });
  }
});
