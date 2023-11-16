// categories is the main data structure for the app; it looks like this:
let categories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */
async function getCategoryIds() {
  const response = await axios.get("http://jservice.io/api/categories", {
    params: {
      count: 6, // Fetch 6 random categories
      offset: Math.floor(Math.random() * 18000), // Random offset for variety
    },
  });
  return response.data.map((category) => category.id);
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      { question: "Hamlet Author", answer: "Shakespeare", showing: null },
 *      { question: "Bell Jar Author", answer: "Plath", showing: null },
 *      ...
 *   ]
 */
async function getCategory(catId) {
  const response = await axios.get(`http://jservice.io/api/category`, {
    params: {
      id: catId,
    },
  });
  const category = response.data;
  const clues = category.clues.map((clue) => ({
    question: clue.question,
    answer: clue.answer,
    showing: null,
  }));
  return {
    title: category.title,
    clues: clues,
  };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */
async function fillTable() {
  const $jeopardyTable = $("#jeopardy");

  // Clear the table contents
  $jeopardyTable.empty();

  // Create the header row with category names
  const $thead = $("<thead>");
  const $headerRow = $("<tr>");
  categories.forEach((category) => {
    const $categoryHeader = $("<th>").text(category.title);
    $headerRow.append($categoryHeader);
  });
  $thead.append($headerRow);
  $jeopardyTable.append($thead);

  // Create the table body with questions
  const $tbody = $("<tbody>");
  for (let i = 0; i < 5; i++) {
    const $row = $("<tr>");
    categories.forEach((category) => {
      const $cell = $("<td>")
        .text("?")
        .click(function () {
          handleClick(this, category.clues[i]);
        });
      $row.append($cell);
    });
    $tbody.append($row);
  }
  $jeopardyTable.append($tbody);
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */
function handleClick(cell, clue) {
  if (clue.showing === null) {
    $(cell).text(clue.question);
    clue.showing = "question";
  } else if (clue.showing === "question") {
    $(cell).text(clue.answer);
    clue.showing = "answer";
  }
  // If it's "answer," do nothing on click
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */
function showLoadingView() {
  $("#jeopardy").empty();
  $("#loading").show();
  $("#restart").prop("disabled", true);
}

/** Remove the loading spinner and update the button used to fetch data. */
function hideLoadingView() {
  $("#loading").hide();
  $("#restart").prop("disabled", false);
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */
async function setupAndStart() {
  showLoadingView();
  try {
    const categoryIds = await getCategoryIds();

    categories = await Promise.all(categoryIds.map(getCategory));

    fillTable();
  } catch (error) {
    console.error("Error during setup:", error);
  } finally {
    hideLoadingView();
  }
}

// Event handler for the "Start/Restart" button
$("#restart").click(setupAndStart);

// Event delegation for handling clicks on questions
$("#jeopardy").on("click", "td", function () {
  const categoryIndex = $(this).index();
  const clueIndex = $(this).parent().index() - 1;
  const clue = categories[categoryIndex].clues[clueIndex];
  handleClick(this, clue);
});

// Initialize the game when the page loads
$(document).ready(setupAndStart);
