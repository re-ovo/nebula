
fn initRNG(pixel: vec2u, frame: u32) {
    rngState = pixel.x + pixel.y * 1000u + frame * 100000u;
}
