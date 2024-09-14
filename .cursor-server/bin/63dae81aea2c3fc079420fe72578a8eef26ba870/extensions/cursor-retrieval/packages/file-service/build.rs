use std::path::Path;

extern crate napi_build;

fn main() -> Result<(), anyhow::Error> {
  #[cfg(target_os = "windows")]
  println!("cargo:rustc-cdylib-link-arg=/SUBSYSTEM:WINDOWS");
  napi_build::setup();

  // print the relative path.
  // let workspace_root = "../../../../../";
  // let path = std::path::Path::new(workspace_root).canonicalize()?;
  // let include_path = Path::join(&path, "schema");

  // // let relevant_protos = &[
  // // 	"aiserver/v1/repository.proto",
  // // 	"aiserver/v1/symbolic_context.proto",
  // // 	"aiserver/v1/utils.proto"
  // // ];
  // // let proto_paths = relevant_protos
  // //   .iter()
  // //   .map(|proto| Path::join(&include_path, proto))
  // // 	.collect::<Vec<_>>();
  // let proto_glob = Path::join(&include_path, "aiserver/v1/*.proto");
  // let relevant_protos: Vec<_> = glob::glob(proto_glob.to_str().expect("Failed to convert path to str"))?
  //   .filter_map(Result::ok)
  //   .collect();

  // let proto_paths = relevant_protos
  //   .iter()
  //   .map(|proto_path| proto_path.to_str().expect("Failed to convert path to str"))
  //   .collect::<Vec<_>>();
  // let includes = &[include_path.to_str().unwrap()];

  // // print the path
  // println!("cargo:rustc-env=INCLUDE_PATH={}", include_path.display());

  // tonic_build::configure()
  //   .build_server(false)
  // 	.build_transport(true)
  // 	.out_dir("src/proto")
  //   .compile(&proto_paths, includes)?;

  Ok(())
}
