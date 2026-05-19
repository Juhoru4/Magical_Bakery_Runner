const characters = [

  {
    name: "Laby",
    color: "#f17c9b",
    width: "200px",
    image: "https://elwiki.net/wiki/images/thumb/1/16/Portrait_-_Shining_Romantica.png/340px-Portrait_-_Shining_Romantica.png"
  },

  {
    name: "Rose",
    color: "#ffca53",
    width: "270px",
    image: "https://pa1.narvii.com/6613/aefc759c1a23efe8c95713fdaa601b98347d62fc_hq.gif"
  },

  {
    name: "Aisha",
    color: "#9400d3",
    width: "250px",
    image: "https://i.pinimg.com/originals/ae/ee/f8/aeeef8e3d506ccaa77dd418d719dc330.png"
  }

];

const cardsContainer = document.getElementById("cards");

characters.forEach(character => {

  cardsContainer.innerHTML += `

    <div class="card">

      <div class="card__character">
        <img
          src="${character.image}"
          style="width:${character.width}"
        >
      </div>

      <div
        class="card__shape"
        style="background:${character.color}"
      ></div>

      <div
        class="card__detail"
        style="background:${character.color}"
      >

        <h1>${character.name}</h1>

        <div class="card__detail__rate">

          <img src="https://i.imgur.com/OoOIyfX.png">

          <p>824 People score</p>

        </div>

        <div class="card__detail__statistics">

          <div class="card__detail__statistics-bag">

            <span>
              <label>Type</label>
              <p>Physical</p>
            </span>

            <img src="https://i.imgur.com/f8cvB9m.png">

          </div>

          <div class="card__detail__statistics-bag">

            <span>
              <label>Speed</label>
              <p>Average</p>
            </span>

            <img src="https://i.imgur.com/93x3Mri.png">

          </div>

        </div>

        <div class="card__logo">

          <img src="https://static.wixstatic.com/media/71b9db_149c0db80b7d4643ab931f36710fd998~mv2.png/v1/fill/w_477,h_327,al_c,q_85,usm_0.66_1.00_0.01/71b9db_149c0db80b7d4643ab931f36710fd998~mv2.webp">

        </div>

      </div>

    </div>

  `;

});