const logoURL = chrome.extension.getURL("images/logo.png")
const emoticonsUrl = chrome.extension.getURL("data/emoticons.json")
const profilesUrl = chrome.extension.getURL("data/profiles.json")
const queroUrl = chrome.extension.getURL("data/quero.json")

let isPaused = false
let botWorkCycle = null

let countComment = 0
let countCommentStack = 0

let emoticons = []
let profiles = []
let quero = []

let countdownTimer = {}
const counterTitleSelector = "#countdown-title > h1"

let secondsWorked = 0
let internalClock;

$(document).ready(async() => {
  await loadResources()

  startModal()

  const rootInterval = setInterval(() => {
    const container = $(".Kj7h1");

    if (container.length > 0) {
      clearInterval(rootInterval);

      events();
      buildCountdown()
    }
  }, 1000);
});

async function loadResources() {
  emoticons = await loadList(emoticonsUrl)
  profiles = await loadList(profilesUrl)
  quero = await loadList(queroUrl)
}

async function loadList(url) {
  return fetch(url)
    .then(response => response.json())
}

function startModal() {
  let modal = `
    
    <div 
      class="modal fade main-modal" 
      id="main-modal" 
      data-backdrop="static"
      data-keyboard="false"
			tabindex="-1" 
			role="dialog"
		>
      <div class="modal-dialog" role="document">
        <div class="modal-content p-3">
          <div class="modal-logo-root">
            <img src="${logoURL}" alt="logomarca" />
          </div>

            <!-- Tela inicial -->
            <form id="frmStep0">
              <h1 class="modal-title gradient">Robô de comentários</h1>
              
              <div class="container p-3">
                <div class="row justify-content-center">
                  <div class="col-md-4">
                    <button id="exit" type="submit" class="btn">Sair do robô</button>
                  </div>

                  <div class=" col-md-6">
                    <button id="start" type="submit" class="btn">Bora ganhar sorteios!</button>
                  </div>
                </div>
              </div>
            </form>
          
            <!-- Tela 1 -->
            <form id="frmStep1" hidden>
              
              <h1 class="modal-title gradient">Robô de comentários</h1>
              
              <h6 class="modal-subtitle">Selecione uma lista</h6>

              <select class="form-control" id="list">
                <option value="">Selecione</option>
                <option value="profiles">
                  Lista @'s
                </option>
                
                <option value="I want">
                  Lista "Eu quero"
                </option>

                <option value="ok">
                  Lista "Ok"
                </option>

                <option value="emoticons">
                  Lista "Emoticons"
                </option>
              </select>

              <h6 style="color: #fff; font-size: 18px" class="mt-3 mb-3">Ou criar própria lista:</h6>
              
              <input class="form-control" id="persoList" autocomplete="off" placeholder='Separe os elementos por ";"' />
              
              <div class="form-row" style="justify-content: center;">
                  <div style="width: 98%;" class="alert alert-danger mt-3" id="alert-step-1" role="alert" hidden>
                    <span></span>
                  </div>
              </div>

              <div class="modal-button-root mt-2">
                <button type="submit" class="btn btn-primary">Próximo</button>
              </div>
            </form>

            <!-- Tela 2 -->
            <form id="frmStep2" hidden>
              <h1 class="modal-title gradient">Robô de comentários</h1>
              
              <h6 class="modal-subtitle">Elementos inseridos a cada comentário feito</h6>
              
              <div class="">
                <div class="mx-sm-5 ml-2">
                  <input type="number" class="form-control" id="itemsQuantity" min="1" value="1" required />
                </div>
              </div>

              <div class="modal-button-root">
                <button type="submit" class="btn btn-primary">Próximo</button>
              </div>
            </form>

            <!-- Tela 3 -->
            <form id="frmStep3" hidden>
              <h1 class="modal-title gradient">Robô de comentários</h1>
              
              <h6 class="modal-subtitle">Informe o tempo de atraso de cada comentários</h6>

              <div class="row">
                <div class=col col-6>
                  <div class="form-group">
                    <label for="exampleFormControlInput1">Tempo mínimo (s)</label>
                    
                    <input type="number" class="form-control" id="timeMin" min="1" max="600" value="10" required />
                  </div>
                </div>

                <div class=col col-6>
                  <div class="form-group">
                    <label for="exampleFormControlInput1">Tempo máximo (s)</label>
                    
                    <input type="number" class="form-control" id="timeMax" min="1" max="600" value="30" required />
                  </div>
                </div>
              </div>

              <div class="modal-button-root">
                <button type="submit" class="btn btn-primary">Próximo</button>
              </div>
            </form>
            
            <!-- Tela 4 -->
            <form id="frmStep4" hidden>
              <h1 class="modal-title gradient">Robô de comentários</h1>

              <h6 class="modal-subtitle">Informe a condição de pausa do Robô</h6>

              <!-- Condição de pausa do bot -->

              <div class="row form-group">
                  <div class="col">
                      <div class="form-group">
                          <label for="exampleFormControlInput1" style="font-size: 18px;margin-bottom: 10px;">Critério</label>

                          <select class="form-control" id="pauseConditionCriteria">
                              <option value="">Selecione</option>

                              <option value="byNumber">
                                  Por quantidade de comentários
                              </option>

                              <option value="byTimer">
                                  Por tempo de execução
                              </option>
                          </select>
                      </div>
                  </div>

                  <div class="col">
                      <div class="form-group">
                          <label for="pauseConditionValue" style="font-size: 18px;margin-bottom: 10px;">Quantidade</label>
                          <input type="number" class="form-control" id="pauseConditionValue" min="1" max="600" value="1"
                              required="">
                      </div>
                  </div>
              </div>



              <!-- Tempo de pausa do bot -->
              <div class="form-group">
                  <div class=" custom-control ">
                      <input type="checkbox" class="form-check-input" id="stopBotCheck">
                      <label class="" for="customCheck1" style="font-size: 18px;">Parar o robô ao invés de pausar?</label>
                  </div>
              </div>

              <h6 style="color: #fff; font-size: 18px" class="mt-3 mb-3">Defina um período de pausa em minutos:</h6>
              <input type="number" class="form-control" id="interval" min="1" max="600" value="1" required="">

              <div class="form-row" style="justify-content: center;">
                  <div style="width: 98%;" class="alert alert-danger mt-3" id="alert-step-4" role="alert" hidden="">
                      <span></span>
                  </div>
              </div>

              <div class="modal-button-root">
                  <button type="submit" id="start-button-step-3" class="btn btn-primary start-button">Iniciar</button>
              </div>

          </form>

          </div>
        </div>
      </div>
    </div>
  `;

  $("body").append(modal);  
}

function events() {
  // Evento de exibir modal
  $("#main-modal").modal('show');

  $("#stopBotCheck").on("change", function (e) {
    $("#interval").attr("disabled", e.target.checked);
  })

  $("#exit").on("click", function (e) {
    e.preventDefault();
    $("#main-modal").modal("hide");
    //$(".countdown-root").attr("hidden", true)
  })

  $("#start").on("click", function (e) {
    e.preventDefault();
    $('#frmStep0').attr("hidden", true);
    $('#frmStep1').attr("hidden", false);
  })

  // Evento ao dar submit na lista
  $('#frmStep1').on('submit', function (e) {
    e.preventDefault();

    // Valida campos
    if (!$('#persoList').val() && !$("#list option:selected").val()) {
      $("#alert-step-1 span").text("Preencha alguma das opções.");
      $("#alert-step-1").attr("hidden", false);
    } else {
      $("#alert-step-1 span").text("");
      $("#alert-step-1").attr("hidden", true);

      $('#frmStep1').attr("hidden", true); // Esconde form antigo      
      $('#frmStep2').attr("hidden", false); // Mostra form do proximo passo    
    }
  });

  // Evento ao dar submit na quantidade de items
  $('#frmStep2').on('submit', function (e) {
    e.preventDefault();

    $('#frmStep2').attr("hidden", true); // Esconde form antigo
    $('#frmStep3').attr("hidden", false); // Mostra form do proximo passo
  });

  // Evento ao dar submit nos intervalos de comentarios do bot
  $('#frmStep3').on('submit', function (e) {
    e.preventDefault();

    $('#frmStep3').attr("hidden", true); // Esconde form antigo
    $('#frmStep4').attr("hidden", false); // Mostra form do proximo passo
  });

  // Evento ao iniciar o bot
  $('#frmStep4').on('submit', function (e) {
    e.preventDefault();

    // Valida campos
    if (!$("#pauseConditionCriteria option:selected").val()) {
      $("#alert-step-4 span").text("Escolha o critério de pausa.");
      $("#alert-step-4").attr("hidden", false);
    } else {
      $("#alert-step-4 span").text("");
      $("#alert-step-4").attr("hidden", true);

      setLoading();
      handleBotDataMount();
      handleInstagramBlock();
    }
  })

  $("#pauseConditionCriteria").change(function() {
    let criteria = $(this).val()
    let label = $("label[for=pauseConditionValue]")

    if(criteria == "byNumber") {
      label.text("Quantidade")
    } else if(criteria == "byTimer") {
      label.text("Minutos")
    }
  })

  //$("#countdownContainer").attr("hidden", false)

  function handleInstagramBlock() {
    const instagramErrorDivSelector = ".CgFia"
    const instagramErrorMessageSelector = "div[class='HGN2m XjicZ']"

    $(instagramErrorDivSelector)
      .on('DOMNodeInserted', instagramErrorMessageSelector, () => {

        document.querySelector(instagramErrorDivSelector).hidden = true
        document.querySelector("form.X7cDz > textarea").disabled = false

        if(!isPaused) blockBotWork(4)
      });
  }
}


function buildCountdown() {
  $(".ltEKP").append(`
        <div class="countdown-root">
          <div class="countdown-container">
            
            <div class="countdown-content" id="countdown-title">
              <h1 style="margin-bottom: 15px">Contador</h1>
            </div>

            <div class="dropdown-divider"></div>

            <div class="countdown-content">
              <p>Tempo do próximo comentário:</p>
              <div id="next-comment">0s</div>
            </div>

            <div class="countdown-content" id="countdownContainer">
              <p>Tempo de execução:</p>
              <div id="countdown">00:00:00</div>
            </div>

            <div class="countdown-content" id="countdownPauseContainer" hidden>
              <p>Tempo até o fim da pausa:</p>
              <div id="countdownPause">00:00:00</div>
            </div>
            
            <div class="countdown-content">
              <p>Comentários feitos:</p>
              <div id="countComment">0</div>
            </div>
          </div>
        </div>
      `);
}


function setLoading() {
  $("#frmStep3 button").attr("disabled", true);
  $("#frmStep3 button").text("Aguarde...");
}

function handleBotDataMount() {
  let data = {
    itemsQuantity: parseInt($("#itemsQuantity").val()),
    time: {
      min: parseInt($("#timeMin").val()),
      max: parseInt($("#timeMax").val()) 
    },
    interval: parseInt($("#interval").val()),
    pauseCondition: {
      criteria: $("#pauseConditionCriteria").val(),
      value: parseInt($("#pauseConditionValue").val())
    },
    abortBotOnPauseTime: $("#stopBotCheck").is(':checked')
  }

  if ($('#persoList').val()) {
    data.list = $('#persoList').val().split(";");
  } else {
    const options = { emoticons, profiles, ok: "Ok;".repeat(data.itemsQuantity).split(";"), "I want": quero };
    const selectedOption = $("#list option:selected").val();
    data.list = options[selectedOption];
  }

  // Fechar modal  
  $("#main-modal").modal("hide");

  startCountdown();
  runBot(data);
}


function startCountdown() {
  const time = new Date().getTime();

  $("#countdown")
    .countdown(time, { elapse: true })
    .on("update.countdown", function (event) {
      const $this = $(this);

      $this.html(event.strftime('<span>%H:%M:%S</span>'));

      countdownTimer = event;
  });
}


function runBot(args) {
  const workspace = location.href
  
  let { list, itemsQuantity, time, interval, pauseCondition, abortBotOnPauseTime } = args
  
  let sorTiming = setSortTiming(time.max, time.min)
  let intervalWork = parseInt(`${sorTiming}000`)
  
  $('#next-comment').text(sorTiming)

  internalClock = setInterval(() => {
    if(isPaused) return 
    
    secondsWorked++
    //console.log(`Segundos registrados: ${secondsWorked}`)

    if (isTimeToPauseBot(pauseCondition)) {
      if(abortBotOnPauseTime) {
        stopBotWork()
      } else {
        pauseBotWork(interval)
      }
    }
  }, 1000)
  
  botWorkCycle = setInterval(() => {
    if(isPaused) return

    if (!isWorkspace(workspace)) {
      stopBotWork()
      return;
    }

    // Sorteias os elementos da lista
    let elementsSelected = getElementsFromList(list, itemsQuantity)

    let comment = buildComment(elementsSelected);
    sendComment(comment)

    countComment++
    countCommentStack++
    $("#countComment").html(countComment)

    // Sorteias o tempo novamente
    sorTiming = setSortTiming(time.max, time.min)
    $('#next-comment').text(sorTiming)

    intervalWork = parseInt(`${sorTiming}000`)

    if (isTimeToPauseBot(pauseCondition)) {
      if(abortBotOnPauseTime) {
        stopBotWork()
      } else {
        pauseBotWork(interval)
      }

      return;
    }

  }, intervalWork)
}

function buildComment(list) {
  let comment = "";

  for (const element of list) {
    comment += `${element} `;
  }

  return comment
}

function getElementsFromList(list, itemsQuantity) {
  list = list.sort(randElementsList)
  return list.slice(0, itemsQuantity)
}

function isWorkspace(workspace) {
  return location.href == workspace;
}

function stopBotWork() {
  //console.log("Robô encerrou as atividades")
  clearInterval(botWorkCycle);
  clearInterval(internalClock);
  stopCountdown();
  document.querySelector(counterTitleSelector).innerText += "- Robô encerrou as atividades"
}

function stopCountdown() {
  $('#countdown').countdown('pause');
}

function startIntervalCronometer(interval) {
  const currentTime = new Date().getTime();
  const time = new Date(currentTime + interval * 60 * 1000).getTime();

  $("#countdownPauseContainer").attr("hidden", false)
  $("#countdownContainer").attr("hidden", true)

  $("#countdownPause")
    .countdown(time, { elapse: false })
    .on("update.countdown", function (event) {
      const $this = $(this);

      $this.html(event.strftime('<span>%H:%M:%S</span>'))
    })
    .on('finish.countdown', function (event) {
      const $this = $(this);

      $("#countdownPauseContainer").attr("hidden", true)
      $("#countdownContainer").attr("hidden", false)

      $this.html(event.strftime('<span>%H:%M:%S</span>'))
    })
}

function setSortTiming(max, min) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randElementsList() {
  return Math.round(Math.random()) - 0.5;
}

function isTimeToPauseBot(pauseCondition) {
  const { value, criteria } = pauseCondition;

  let validations = {
    byNumber: () => countCommentStack % value == 0 && countCommentStack > 0,
    byTimer: () => {
      const minutes = Math.floor(secondsWorked / 60) //getMinutesFromCountdown();
      return minutes % value == 0 && minutes > 0;
    }
  }
  
  //console.log(pauseCondition, validations[criteria]())
  return validations[criteria]()
}

function getMinutesFromCountdown() {
  return countdownTimer.offset.minutes;
}

function pauseBotWork(intervalInMinutes) {
  document.querySelector(counterTitleSelector).innerText += ` - Pausado por ${intervalInMinutes} minuto${intervalInMinutes > 1 ? "s" : ""}`
  
  isPaused = true
  $("#countdown").countdown('stop')
  
  setBotInterval(intervalInMinutes)
  startIntervalCronometer(intervalInMinutes)
  
  //console.log("Robô em pausa - condição atingida")

  secondsWorked = 0;
  countCommentStack = 0;
}

function blockBotWork(intervalInMinutes) {
  document.querySelector(counterTitleSelector).innerText += ` - Pausado por ${intervalInMinutes} minuto${intervalInMinutes > 1 ? "s" : ""} - Proteção contra bloqueio`
  
  isPaused = true
  $("#countdown").countdown('stop')

  setBotInterval(intervalInMinutes)
  startIntervalCronometer(intervalInMinutes)
  
  //console.log("Robô em pausa por causa do bloqueio")
}

function setBotInterval(intervalInMinutes) {
  setTimeout(() => {
    isPaused = false;
    
    //console.log("Robô trabalhando")
    $("#countdown").countdown('start');
    
    document.querySelector(counterTitleSelector).innerText = "Contador" 
  }, intervalInMinutes * 60000);
}

function sendComment(comment) {
  const inputComment = document.querySelector("form.X7cDz > textarea");
  const publishButton = document.querySelector("form.X7cDz > button.sqdOP.yWX7d.y3zKF");

  inputComment.value = "";
  inputComment.value = comment;
  inputComment.dispatchEvent(new Event("input", { bubbles: true }));

  publishButton.removeAttribute("disabled");
  publishButton.click();

  if(countComment == 1) setTimeout( () => inputComment.value = "", 700)
}