const apodContainer = document.getElementById("apod-container");

const fetchAPOD = async (date) => {
  const errorMessage = document.getElementById("error-message");
  try {
    apodContainer.innerText = "Loading... ⏳";
    errorMessage.textContent = "";

    const url = `https://api.nasa.gov/planetary/apod?date=${date}&api_key=DEMO_KEY`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch data from NASA API");
    }

    const data = await response.json();

    apodContainer.innerHTML = `
      <img src="${data.url}" alt="${data.title}" width="600">
      <h2>${data.title}</h2>
      <p>${data.explanation}</p>
    `;

  } catch (error) {
    apodContainer.innerHTML = "";
    errorMessage.textContent = "Error loading data 😢";
    console.error(error);
  }
};

document.getElementById("birthdayForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const birthday = document.getElementById("birthday").value;
  const errorMessage = document.getElementById("error-message");

  const minDate = new Date("1995-06-16");

  if (new Date(birthday) < minDate) {
    errorMessage.textContent = "Please select a date on or after June 16, 1995.";
    apodContainer.innerHTML = "";
  } else {
    errorMessage.textContent = "";
    fetchAPOD(birthday);
  }
});