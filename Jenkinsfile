pipeline {
    agent any
    stages {
        stage('Hello') {
            steps {
                echo 'Hello, World test #3! ' 
            }
        }
        stage('Test') {
            steps {
                echo 'Test stage'
                sh 'sudo docker ps -a' 
            }
        }        
    }
}
