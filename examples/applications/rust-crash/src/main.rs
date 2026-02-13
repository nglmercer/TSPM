use std::env;
use std::io::prelude::*;
use std::net::TcpListener;
use std::process;
use std::thread;
use std::time::Duration;

fn main() {
    let args: Vec<String> = env::args().collect();
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    
    println!("Rust app starting on port {}", port);

    let listener = TcpListener::bind(format!("0.0.0.0:{}", port));
    
    match listener {
        Ok(l) => {
            println!("Server process PID: {}", process::id());
            
            for stream in l.incoming() {
                match stream {
                    Ok(mut stream) => {
                        let mut buffer = [0; 1024];
                        stream.read(&mut buffer).unwrap();
                        
                        let response = "HTTP/1.1 200 OK\r\n\r\nHello from Rust!";
                        stream.write(response.as_bytes()).unwrap();
                        stream.flush().unwrap();
                        
                        // Only crash if explicitly enabled via environment variable
                        if env::var("ENABLE_CRASH").unwrap_or_default() == "true" {
                            println!("Request received, initiating crash sequence...");
                            thread::sleep(Duration::from_millis(100));
                            panic!("Intentional crash to test respawn logic!");
                        }
                    }
                    Err(e) => {
                        eprintln!("Connection failed: {}", e);
                    }
                }
            }
        },
        Err(e) => {
            eprintln!("Failed to bind port: {}", e);
            process::exit(1);
        }
    }
}
