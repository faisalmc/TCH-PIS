pipeline {
    agent any

    // Global environment variables for k8s
    environment {
        AZURE_CLIENT_ID     = credentials('azure-client-id')
        AZURE_CLIENT_SECRET = credentials('azure-client-secret')
        AZURE_TENANT_ID     = credentials('azure-tenant-id')

        // Tag for the new Docker image
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        DOCKER_IMAGE = "faisalmch/tch-pis-k8s:${IMAGE_TAG}"

    }

    stages {
        // Stage: Checkout
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        // Stage: Launch Docker Container
        stage('Launch Docker Container') {
            steps {
                script {
                    sh '''
                    echo "Stopping any existing container..."
                    if [ "$(docker ps -aq -f name=tch-pis-container)" ]; then
                        docker stop tch-pis-container || true
                        docker rm tch-pis-container || true
                    fi

                    echo "Launching new Docker container (for testing)..."
                    docker run -d --name tch-pis -p 3000:3000 -p 3001:3001 -p 3002:3002 tch-pis-image:1.0 tail -f /dev/null
                    '''
                }
            }
        }
        
        // Stage: UNIT_TEST
        stage('UNIT_TEST') {
            steps {
                script {
                    sh '''
                    echo "Cloning repository into container and running tests..."
                    docker exec tch-pis git clone https://github.com/faisalmc/TCH-PIS.git /app/TCH-PIS
                    docker exec tch-pis sh -c "cd /app/TCH-PIS && npm install"
                    docker exec tch-pis sh -c "cd /app/TCH-PIS && npm run test"
                    '''
                }
            }
        }
        
        // Stage: SonarQube Analysis
        // This stage updates Node.js (using NVM) and runs SonarQube analysis.
        stage('SonarQube Analysis') {
            steps {
                script {
                    sh '''
                    echo "Checking current Node.js version..."
                    node -v || echo "Node.js not found"
                    
                    echo "Installing NVM and updating Node.js to version 16..."
                    export NVM_DIR="$HOME/.nvm" || mkdir -p "$HOME/.nvm"
                    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
                    . "$HOME/.nvm/nvm.sh"
                    nvm install 16
                    nvm use 16
                    echo "Updated Node.js version:"
                    node -v
                    
                    echo "Running SonarQube Scanner..."
                    /opt/sonar-scanner/bin/sonar-scanner \
                      -Dsonar.projectKey=TCH-PIS \
                      -Dsonar.projectName=TCH-PIS \
                      -Dsonar.projectVersion=1.0 \
                      -Dsonar.sources=services \
                      -Dsonar.language=js \
                      -Dsonar.host.url=http://209.38.120.144:9000 \
                      -Dsonar.login=squ_7cfa9c7d2e750c8eed27046bea9b2a8c0009235e
                    '''
                }
            }
        }
        
        // Stage: BUILD
        stage('BUILD') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
            }
            steps {
                script {
                    sh '''
                    echo "Starting application services inside container..."
                    docker exec tch-pis sh -c "cd /app/TCH-PIS && nohup npm run start-all > services.log 2>&1 &"
                    '''
                }
            }
        }
        
        // Stage: Postman Tests
        stage('Postman Tests') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'POSTMAN_API_KEY', variable: 'POSTMAN_API_KEY')]) {
                        sh '''
                        echo "Logging into Postman..."
                        postman login --with-api-key $POSTMAN_API_KEY
                        echo "Running Postman collection tests..."
                        postman collection run "41554359-536005ad-d0e6-44a4-b618-6b6730ffa88c"
                        '''
                    }
                }
            }
        }
        
        // Stage: Security Testing with OWASP ZAP
        // runs OWASP ZAP in daemon mode, accesses your application, waits for scans, and generates a report
        stage('Security Testing with OWASP ZAP') {
            steps {
                script {
                    sh '''
                    echo "Starting OWASP ZAP for security testing..."
                    mkdir -p zap-reports
                    /opt/zaproxy/zap.sh -daemon -host 0.0.0.0 -port 8090 -config api.disablekey=true &
                    sleep 30
                    echo "Accessing target URLs via ZAP..."
                    curl "http://localhost:8090/JSON/core/action/accessUrl/?url=http://209.38.120.144:3000"
                    curl "http://localhost:8090/JSON/core/action/accessUrl/?url=http://209.38.120.144:3001"
                    curl "http://localhost:8090/JSON/core/action/accessUrl/?url=http://209.38.120.144:3002"
                    sleep 30
                    echo "Generating ZAP report..."
                    curl -s "http://localhost:8090/OTHER/core/other/htmlreport/" > zap-reports/zap-report.html
                    echo "Shutting down ZAP..."
                    curl "http://localhost:8090/JSON/core/action/shutdown/"
                    '''
                }
            }
        }

        // Build and push the new Docker image stage.
        stage('Build and Push Docker Image') {
            steps {
                script {
                    echo "Building Docker image with tag: ${DOCKER_IMAGE}"
                    sh "docker build -t ${DOCKER_IMAGE} -f Dockerfile.k8s ."
                    echo "Pushing Docker image ${DOCKER_IMAGE} to Docker Hub"
                    sh "docker push ${DOCKER_IMAGE}"
                }
            }
        }

        // Stage: Deploy to AKS
        // logs into Azure using the Service Principal, sets the kubeconfig context, and deploys the k8s YAMLs
        stage('Deploy to AKS') {
            steps {
                script {
                    sh '''
                        echo "Logging into Azure with Service Principal"
                        az login --service-principal \
                          --username "$AZURE_CLIENT_ID" \
                          --password "$AZURE_CLIENT_SECRET" \
                          --tenant "$AZURE_TENANT_ID"

                        echo "Connecting to AKS Cluster"
                        az aks get-credentials --resource-group myResourceGroup --name myAKSCluster --overwrite-existing

                        echo "Deploying Kubernetes YAMLs"
                        kubectl apply -f "${WORKSPACE}/k8s/deployment.yaml"
                        kubectl apply -f "${WORKSPACE}/k8s/service.yaml"

                        echo "Updating deployment with new image tag"
                        kubectl set image deployment/tch-pis tch-pis-container=${DOCKER_IMAGE}

                        echo "Forcing new rollout with 'kubectl rollout restart deployment/tch-pis'"
                        kubectl rollout restart deployment/tch-pis

                        echo "Checking rollout status"
                        kubectl rollout status deployment/tch-pis
                    '''

                }
            }
        }

    }
    
    // Post actions run after the pipeline, regardless of success or failure.
    post {
        always {
            script {
                echo "Archiving ZAP reports..."
                archiveArtifacts artifacts: "zap-reports/*", allowEmptyArchive: true
                
                // Clean up Docker container if it exists.
                echo "Cleaning up Docker container..."
                sh '''
                    pkill -f "zap.sh" || true
                    docker stop tch-pis || true
                    docker rm tch-pis || true
                '''
            }
        }
    }
}
