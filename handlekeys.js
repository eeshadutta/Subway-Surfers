document.addEventListener(
    "keydown",
    event => {
        key = event.keyCode;
        console.log(key);
        if (key == 39) {
            player.pos[0] += 6;
            police.pos[0] = player.pos[0];
        }
        if (key == 37) {
            player.pos[0] -= 6;
            police.pos[0] = player.pos[0];
        }
        if (key == 38) {
            player.pos[1] += 4;
            if (player.pos[1] > 3)
                player.pos[1] = 3;
            police.pos[1] = player.pos[1];
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
