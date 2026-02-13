use std::env;
use std::io::prelude::*;
use std::net::TcpListener;
use std::process;
use std::thread;
use std::time::Duration;

fn main() {
    let args: Vec<String> = env::args().collect();
    let port = args.get(1).unwrap_or(&"8080".to_string()).clone();
    
    println!("Rust app starting on port {}", port);

    // Simulate startup time
    thread::sleep(Duration::from_millis(500));

    let listener = TcpListener::bind(format!("127.0.0.1:{}", port));
    
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
                        
                        // CRASH LOGIC for testing respawn
                        println!("Request received, initiating crash sequence...");
                        thread::sleep(Duration::from_millis(100));
                        panic!("Intentional crash to test respawn logic!");
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
