document.addEventListener(
    "keydown",
    event => {
        key = event.keyCode;
        if (key == 39) {
            player.pos[0] += 6;
            police.pos[0] = player.pos[0];
        }
        if (key == 37) {
            player.pos[0] -= 6;
            police.pos[0] = player.pos[0];
        }
        if (key == 38) {
            if (player.pos[1] < -4) {
                player.pos[1] = -4;
            }
            jumping = true;
            ducking = false;
            player.speedy = 0.3;
        }
        if (key == 40) {
            if (player.pos[1] != -4) {
                player.pos[1] = -4;
            }
            ducking = true;
            jumping = false;
            player.speedy = 0.2;
        }

        if (key == 49) {
            theme = 1;
            theme_flag = 1;
        }
        if (key == 50) {
            theme = 2;
            theme_flag = 1;
        }
    },
    false
);
