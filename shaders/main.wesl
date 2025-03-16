import package::rand::{initRNG};

struct FragmentInput {
    pixel: vec2f,
    frame: f32,
}

var<private> rngState: u32;


@fragment
fn fragment(in: FragmentInput) -> vec4f {
    initRNG(in.pixel, in.frame);
    return vec4f(1.0, 0.0, 0.0, 1.0);
}